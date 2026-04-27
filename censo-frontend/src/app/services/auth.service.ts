import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = environment.apiUrl || 'http://localhost:5203'; 

  login(credenciales: { usuario: string, contrasena: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, credenciales)
      .pipe(
        tap(response => {
          if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
          }
        })
      );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_censo_actual'); 
    localStorage.removeItem('temp_departamento');
    this.router.navigate(['/login']);
  }

  obtenerUsuarioId(): number | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // 3. En NestJS, el ID se guarda en la propiedad 'sub'
      return payload.sub; 
    } catch (e) {
      return null;
    }
  }

  getUserRole(): string | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Payload del token:', payload); 
      return payload.role || null; 
    } catch (e) {
      console.error('Error decodificando token:', e);
      return null;
    }
  }

  obtenerRole(): string | null {
    return this.getUserRole();
  }

  estaLogueado(): boolean {
    return !!localStorage.getItem('access_token');
  }
}