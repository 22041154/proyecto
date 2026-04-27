import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CensoApiService } from '../../services/censo-api'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private censoService = inject(CensoApiService); 

  credenciales = {
    usuario: '',
    contrasena: ''
  };

  error = false;
  mensajeError = '';
  cargando = false;

  ingresar() {
    if (!this.credenciales.usuario || !this.credenciales.contrasena) {
      this.error = true;
      this.mensajeError = 'Por favor ingresa usuario y contraseña';
      return;
    }

    this.cargando = true;
    this.error = false;

    this.authService.login(this.credenciales).subscribe({
      next: (res: any) => {
        const token = res.access_token || res.token; 
        
        if (token) {
          localStorage.setItem('access_token', token);
          
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));

            if (payload.role === 'superadmin' || payload.role === 'admin') {
              this.cargando = false;
              this.router.navigate(['/admin-usuarios']);
            } else {
              this.continuarCenso();
            }
          } catch (e) {
            console.error('Error al decodificar el token:', e);
            this.cargando = false;
            this.router.navigate(['/paso1']); 
          }
        } else {
          this.cargando = false;
        }
      },
      error: (err) => {
        this.cargando = false;
        this.error = true;
        this.mensajeError = err.error?.message || 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
      }
    });
  }

  continuarCenso() {
    this.censoService.obtenerMiProgreso().subscribe({
      next: (progreso: any) => {
        if (this.cargando !== undefined) this.cargando = false; 

        // Si no hay avance, lo mandamos al inicio
        if (!progreso) {
          this.router.navigate(['/paso1']); 
          return;
        }

        // Guardamos el ID en memoria
        localStorage.setItem('id_censo_actual', progreso.iddatos.toString());

        // 🚀 NUEVO: ¿Ya llenó el Paso 5 (Servicios y Periféricos)? -> Mandar al Reporte
        // Revisamos que no sea nulo ni indefinido, ya que puede ser 'false' (si dijeron que NO hay impresoras)
        if (progreso.tiene_impresora_estudiantes !== null && progreso.tiene_impresora_estudiantes !== undefined) {
          this.router.navigate(['/resumen']); // ⚠️ OJO: Cambia '/resumen' por el nombre real de la ruta de tu reporte
        }
        // ¿Ya llenó el Paso 4 (Conectividad / Adquisiciones)? -> Mandar al Paso 5
        else if (progreso.mediosConexionSeleccionados && progreso.mediosConexionSeleccionados.length > 0) {
          this.router.navigate(['/servicios']);
        }
        // ¿Ya llenó el Paso 3 (Catálogos de hardware)? -> Mandar al Paso 4
        else if (progreso.conteosTipo && progreso.conteosTipo.length > 0) {
          this.router.navigate(['/conectividad']);
        }
        // ¿Ya llenó el Paso 2 (Uso e Internet)? -> Mandar al Paso 3
        else if (progreso.uso_educativo !== null && progreso.uso_educativo !== undefined) {
          this.router.navigate(['/detalle-educativo']);
        }
        // ¿Ya llenó el Paso 1 (Equipos operativos)? -> Mandar al Paso 2
        else if (progreso.operativas !== null && progreso.operativas !== undefined) {
          this.router.navigate(['/internet']);
        }
        // Si tiene un registro pero vacío, al inicio
        else {
          this.router.navigate(['/paso1']); 
        }
      },
      error: (e) => {
        console.error('Error al recuperar progreso', e);
        if (this.cargando !== undefined) this.cargando = false;
        this.router.navigate(['/paso1']);
      }
    });
  
  }
}