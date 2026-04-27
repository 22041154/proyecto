import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';
import { CensoApiService } from './services/censo-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, RouterModule], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('censo-frontend');
  private authService = inject(AuthService);
  private router = inject(Router);
  
  private censoService = inject(CensoApiService);

  esAdmin: boolean = false;

  ngOnInit() {
    this.verificarRol();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.verificarRol();
    });
  }

  verificarRol() {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.esAdmin = (payload.role === 'admin' || payload.role === 'superadmin');
        console.log(`Menú actualizado -> Rol: ${payload.role} | ¿Muestra botón?: ${this.esAdmin}`);
      } catch (e) {
        this.esAdmin = false;
      }
    } else {
      this.esAdmin = false;
    }
  }

  cerrarSesion() {
    this.authService.logout();
    this.esAdmin = false; 
  }

  mostrarHeader() {
    const url = this.router.url || '';
    const ocultarEn = ['/login']; 
    return !ocultarEn.some(prefix => url.startsWith(prefix));
  }

  continuarCenso() {
    this.censoService.obtenerMiProgreso().subscribe({
      next: (progreso: any) => {
        if (!progreso) {
          this.router.navigate(['/paso1']); 
          return;
        }

        localStorage.setItem('id_censo_actual', progreso.iddatos.toString());

        if (progreso.tiene_impresora_estudiantes !== null && progreso.tiene_impresora_estudiantes !== undefined) {
          this.router.navigate(['/resumen']);
        }
        else if (progreso.mediosConexionSeleccionados && progreso.mediosConexionSeleccionados.length > 0) {
          this.router.navigate(['/servicios']);
        }
        else if (progreso.conteosTipo && progreso.conteosTipo.length > 0) {
          this.router.navigate(['/conectividad']);
        }
        else if (progreso.uso_educativo !== null && progreso.uso_educativo !== undefined) {
          this.router.navigate(['/detalle-educativo']);
        }
        else if (progreso.operativas !== null && progreso.operativas !== undefined) {
          this.router.navigate(['/internet']);
        }
        else {
          this.router.navigate(['/paso1']); 
        }
      },
      error: (e) => {
        console.error('Error al recuperar progreso', e);
        this.router.navigate(['/paso1']);
      }
    });
  }
}