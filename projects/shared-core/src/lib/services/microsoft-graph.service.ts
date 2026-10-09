import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { MsalService } from '@azure/msal-angular';

@Injectable({
  providedIn: 'root'
})
export class MicrosoftGraphService {
  private graphUrl = 'https://graph.microsoft.com/v1.0';

  constructor(private http: HttpClient, private msalService: MsalService) {}

    

  private async getToken(scopes: string[] = ['User.Read', 'Mail.Send', 'Files.ReadWrite.All', 'Sites.ReadWrite.All']): Promise<string> {
    let account = this.msalService.instance.getAllAccounts()[0];
    
    if (!account) {
      console.warn('No user logged in to MSAL. Initiating login popup...');
      try {
        await this.msalService.instance.loginPopup({
          scopes: scopes, redirectUri: window.location.origin + '/auth.html'
        });
        account = this.msalService.instance.getAllAccounts()[0];
        if (!account) throw new Error('Still no account after loginPopup');
      } catch (e) {
         throw new Error('User cancelled Microsoft login or login failed');
      }
    }
    
    const request = {
      account: account,
      scopes: scopes, redirectUri: window.location.origin + '/auth.html'
    };

    try {
      const response = await this.msalService.instance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (err: any) {
      console.warn('Failed to acquire token silently. Attempting popup:', err);
      try {
        const response = await this.msalService.instance.acquireTokenPopup(request);
        return response.accessToken;
      } catch (popupErr) {
        console.error('Failed to acquire token via popup:', popupErr);
        throw popupErr;
      }
    }
  }

  /**
   * Sends an email silently from the logged-in user's Outlook/Exchange account.
   */
  sendEmail(toAddresses: string[], subject: string, bodyContent: string, isHtml: boolean = true): Observable<any> {
    const email = {
      message: {
        subject: subject,
        body: {
          contentType: isHtml ? 'HTML' : 'Text',
          content: bodyContent
        },
        toRecipients: toAddresses.map(addr => ({
          emailAddress: { address: addr }
        }))
      },
      saveToSentItems: true
    };

    return from(this.getToken(['User.Read', 'Mail.Send', 'Files.ReadWrite.All'])).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post(`${this.graphUrl}/me/sendMail`, email, { headers });
      })
    );
  }

      /**
     * Gets the default Drive ID for a SharePoint Site URL
     */
    async getSharePointDriveId(sharepointUrl: string): Promise<string> {
      const token = await this.getToken();
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      try {
        const urlObj = new URL(sharepointUrl);
        const hostname = urlObj.hostname;
        let sitePath = urlObj.pathname;
        
        // Auto-sanitize the URL so users can paste long ugly Document Library links
        const match = sitePath.match(/^(\/(?:sites|teams)\/[^\/]+)/i);
        if (match) {
          sitePath = match[1];
        }
        
        const siteEndpoint = `${this.graphUrl}/sites/${hostname}:${sitePath}`;
        const { firstValueFrom } = await import('rxjs');
        const site: any = await firstValueFrom(this.http.get(siteEndpoint, { headers }));
        
        const driveEndpoint = `${this.graphUrl}/sites/${site.id}/drive`;
        const drive: any = await firstValueFrom(this.http.get(driveEndpoint, { headers }));
        
        return drive.id;
      } catch (error) {
        console.error('Error fetching SharePoint Drive ID', error);
        throw error;
      }
    }

  /**
   * Helper to ensure a nested folder path exists in the user's personal root drive.
   */
  async getOrCreateFolderPath(path: string): Promise<any> {
    const token = await this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const parts = path.split('/').filter(p => p.trim() !== '');
    let currentParentPath = 'root';
    let lastDriveItem = null;

    for (let i = 0; i < parts.length; i++) {
      const folderName = parts[i];
      const encodedPathSoFarParent = parts.slice(0, i).map(p => encodeURIComponent(p)).join('/');
      const encodedPathSoFarCurrent = parts.slice(0, i + 1).map(p => encodeURIComponent(p)).join('/');
      
      const endpoint = currentParentPath === 'root' 
        ? `${this.graphUrl}/me/drive/root/children`
        : `${this.graphUrl}/me/drive/root:/${encodedPathSoFarParent}:/children`;

      try {
        const getEndpoint = currentParentPath === 'root'
          ? `${this.graphUrl}/me/drive/root:/${encodeURIComponent(folderName)}`
          : `${this.graphUrl}/me/drive/root:/${encodedPathSoFarCurrent}`;
          
        const { firstValueFrom } = await import('rxjs');
        lastDriveItem = await firstValueFrom(this.http.get(getEndpoint, { headers }));
      } catch (error: any) {
        if (error.status === 404) {
          const payload = {
            name: folderName,
            folder: { },
            '@microsoft.graph.conflictBehavior': 'replace'
          };
          const { firstValueFrom } = await import('rxjs');
          lastDriveItem = await firstValueFrom(this.http.post(endpoint, payload, { headers }));
        } else {
          throw error;
        }
      }
      currentParentPath = folderName;
    }
    
    return lastDriveItem;
  }

  /**
   * Unified method to create a project and SKU workspace in either SharePoint (if URL provided) or personal OneDrive.
   */
  async createProjectWorkspace(
    projectName: string, 
    sku: string, 
    sharepointUrl: string | undefined, 
    onedrivePath: string
  ): Promise<string> {
    const safeProjectName = projectName.replace(/[\/\\:*?"<>|]/g, '-');
    const safeSku = sku.replace(/[\/\\:*?"<>|]/g, '-');
    
    // Default to the provided OneDrive path, e.g., 'ProLoom_Workspace'
    let rootPath = onedrivePath ? onedrivePath.trim() : 'ProLoom_Workspace';
    if (rootPath.endsWith('/')) rootPath = rootPath.slice(0, -1);
    
    const fullPath = `${rootPath}/${safeProjectName}/${safeSku}`;
    
    // If SharePoint URL is provided, try to use it
    if (sharepointUrl && sharepointUrl.trim() !== '') {
      try {
        const driveId = await this.getSharePointDriveId(sharepointUrl);
        const token = await this.getToken();
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        
        const parts = fullPath.split('/').filter(p => p.trim() !== '');
        let currentParentPath = 'root';
        let lastDriveItem = null;
        
        for (let i = 0; i < parts.length; i++) {
          const folderName = parts[i];
          const encodedPathSoFarParent = parts.slice(0, i).map(p => encodeURIComponent(p)).join('/');
          const encodedPathSoFarCurrent = parts.slice(0, i + 1).map(p => encodeURIComponent(p)).join('/');
          
          const endpoint = currentParentPath === 'root' 
            ? `${this.graphUrl}/drives/${driveId}/root/children`
            : `${this.graphUrl}/drives/${driveId}/root:/${encodedPathSoFarParent}:/children`;
            
          try {
            const getEndpoint = currentParentPath === 'root'
              ? `${this.graphUrl}/drives/${driveId}/root:/${encodeURIComponent(folderName)}`
              : `${this.graphUrl}/drives/${driveId}/root:/${encodedPathSoFarCurrent}`;
              
            const { firstValueFrom } = await import('rxjs');
            lastDriveItem = await firstValueFrom(this.http.get(getEndpoint, { headers })) as any;
          } catch (error: any) {
            if (error.status === 404) {
              const payload = {
                name: folderName,
                folder: { },
                '@microsoft.graph.conflictBehavior': 'replace'
              };
              const { firstValueFrom } = await import('rxjs');
              lastDriveItem = await firstValueFrom(this.http.post(endpoint, payload, { headers })) as any;
            } else {
              throw error;
            }
          }
          currentParentPath = folderName;
        }
        return lastDriveItem ? lastDriveItem.webUrl : '';
      } catch (err: any) {
        console.error('Failed to create in SharePoint', err);
        throw new Error('Failed to create SharePoint Workspace Folder. Check SharePoint URL, Permissions, or Admin Consent. Details: ' + err.message);
      }
    } else {
      throw new Error('SharePoint Site URL is not configured in Admin Settings.');
    }
  }

  async getFolderFiles(folderPath: string): Promise<any[]> {
    const token = await this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const encodedPath = folderPath.split('/').filter(p => p.trim() !== '').map(p => encodeURIComponent(p)).join('/');
    const endpoint = `${this.graphUrl}/me/drive/root:/${encodedPath}:/children`;
    try {
      const { firstValueFrom } = await import('rxjs');
      const response: any = await firstValueFrom(this.http.get(endpoint, { headers }));
      return response.value || [];
    } catch (error: any) {
      if (error.status === 404) return [];
      throw error;
    }
  }

  async uploadSmallFile(folderPath: string, file: File): Promise<any> {
    const token = await this.getToken();
    
    let safePath = folderPath;
    if (safePath.startsWith('/')) {
      safePath = safePath.substring(1);
    }
    
    const pathSegments = `${safePath}/${file.name}`.split('/').map(segment => encodeURIComponent(segment));
    const encodedPath = pathSegments.join('/');
    const endpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodedPath}:/content`;
    
    const { firstValueFrom } = await import('rxjs');
    return firstValueFrom(this.http.put(endpoint, file, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type || 'application/octet-stream'
      })
    }));
  }
}



