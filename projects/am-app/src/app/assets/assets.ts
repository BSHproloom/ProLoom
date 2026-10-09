import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AssetService, Asset } from 'shared-core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './assets.html',
  styleUrl: './assets.css'
})
export class Assets {
  public assetService = inject(AssetService);
  downloading: { [id: string]: boolean } = {};

  async downloadAndShare(asset: Asset) {
    this.downloading[asset.id] = true;
    try {
      // 1. Fetch file as blob
      const response = await fetch(asset.downloadUrl);
      const blob = await response.blob();
      
      // 2. Convert blob to base64
      const reader = new FileReader();
      const base64data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      // The result of readAsDataURL is 'data:application/pdf;base64,...'
      const base64Str = base64data.split(',')[1];

      // 3. Write to temporary file
      const savedFile = await Filesystem.writeFile({
        path: asset.name,
        data: base64Str,
        directory: Directory.Cache
      });

      // 4. Share the file URI
      await Share.share({
        title: asset.name,
        url: savedFile.uri,
        dialogTitle: 'Share Asset'
      });
    } catch (e: any) {
      console.error('Error sharing asset', e);
      alert('Error sharing file: ' + e.message);
    } finally {
      this.downloading[asset.id] = false;
    }
  }
}
