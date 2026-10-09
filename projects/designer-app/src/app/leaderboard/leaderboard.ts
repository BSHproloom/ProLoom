import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { UserService, CarpetService, User, Carpet } from 'shared-core';

interface LeaderboardEntry {
  rank: number;
  designer: User;
  completedArtworks: number;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatListModule],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class Leaderboard implements OnInit {
  private userService = inject(UserService);
  private carpetService = inject(CarpetService);
  private cdr = inject(ChangeDetectorRef);
  
  leaderboard: LeaderboardEntry[] = [];
  loading = true;

  ngOnInit() {
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    this.userService.getUsers().subscribe(users => {
      const designers = users.filter(u => u.role === 'Designer');
      
      this.carpetService.getAllCarpets().subscribe((carpets: Carpet[]) => {
        const entries: LeaderboardEntry[] = [];
        
        for (const designer of designers) {
          // Count carpets that are in 'Sent to AM' or 'Approved' status assigned to this designer
          const completed = carpets.filter(c => 
            c.designer === designer.name && 
            (c.status === 'Sent to AM' || c.status === 'Approved')
          ).length;
          
          entries.push({
            rank: 0,
            designer: designer,
            completedArtworks: completed
          });
        }
        
        // Sort descending by completed artworks
        entries.sort((a, b) => b.completedArtworks - a.completedArtworks);
        
        // Assign ranks
        entries.forEach((entry, index) => {
          entry.rank = index + 1;
        });
        
        this.leaderboard = entries;
        this.loading = false;
        this.cdr.detectChanges();
        
        // Check records
        if (entries.length > 0 && entries[0].completedArtworks > 0) {
          this.checkAndSetRecord(entries[0]);
        }
      });
    });
  }

  showCelebration = false;
  recordMessage = '';
  currentRecordHolder = '';
  currentRecordScore = 0;

  async checkAndSetRecord(topEntry: LeaderboardEntry) {
    const { doc, getDoc, setDoc } = await import('firebase/firestore');
    const { db } = await import('shared-core');
    
    const recordRef = doc(db, 'leaderboard_meta', 'record');
    const recordSnap = await getDoc(recordRef);
    
    if (recordSnap.exists()) {
      const data = recordSnap.data();
      this.currentRecordHolder = data['designerName'];
      this.currentRecordScore = data['score'];

      if (topEntry.completedArtworks > data['score']) {
        // New record broken!
        await setDoc(recordRef, {
          designerName: topEntry.designer.name,
          score: topEntry.completedArtworks,
          date: new Date()
        });
        this.currentRecordHolder = topEntry.designer.name;
        this.currentRecordScore = topEntry.completedArtworks;
        this.triggerCelebration(topEntry.designer.name, topEntry.completedArtworks);
      }
    } else {
      // First record
      await setDoc(recordRef, {
        designerName: topEntry.designer.name,
        score: topEntry.completedArtworks,
        date: new Date()
      });
      this.currentRecordHolder = topEntry.designer.name;
      this.currentRecordScore = topEntry.completedArtworks;
    }
    this.cdr.detectChanges();
  }

  triggerCelebration(name: string, score: number) {
    this.recordMessage = `${name} has set a NEW RECORD with ${score} artworks!`;
    this.showCelebration = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.showCelebration = false;
      this.cdr.detectChanges();
    }, 8000); // Hide after 8 seconds
  }
}
