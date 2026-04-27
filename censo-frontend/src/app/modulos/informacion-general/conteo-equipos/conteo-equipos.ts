import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CensoApiService } from '../../../services/censo-api';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-conteo-equipos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './conteo-equipos.html', 
  styleUrls: ['./conteo-equipos.css']
})
export class ConteoEquipos implements OnInit { // Agregamos OnInit
  private authService = inject(AuthService);
  private censoService = inject(CensoApiService);
  private router = inject(Router);

  datos = {
    operativas: null as number | null,
    reparacion: null as number | null,
    reserva: null as number | null
  };

  errores = {
    operativas: false,
    reparacion: false,
    reserva: false
  };

  ngOnInit() {
    // 1. Al entrar a la pantalla, buscamos si el departamento ya tiene un censo iniciado
    this.censoService.obtenerMiProgreso().subscribe({
      next: (progreso: any) => {
        if (progreso) {
          console.log('Censo encontrado para este departamento:', progreso);
          
          // Llenamos los campos con lo que el compañero ya había avanzado
          this.datos.operativas = progreso.operativas;
          this.datos.reparacion = progreso.reparacion;
          this.datos.reserva = progreso.reserva;

          // Guardamos el ID real en el navegador para que los siguientes pasos lo usen
          localStorage.setItem('id_censo_actual', progreso.iddatos.toString());
        } else {
          console.log('No hay censo previo. Se creará uno nuevo al guardar.');
          // Limpiamos el ID por si había basura de otra sesión
          localStorage.removeItem('id_censo_actual');
        }
      },
      error: (e) => console.error('Error al cargar progreso previo:', e)
    });
  }

  cerrarSesion() {
    this.authService.logout();
  }

  guardar() {
    // 1. Reiniciamos el estado de errores
    this.errores.operativas = false;
    this.errores.reparacion = false;
    this.errores.reserva = false;

    // 2. Validamos que no haya campos vacíos
    let tieneErrores = false;
    if (this.datos.operativas === null || this.datos.operativas === undefined) { this.errores.operativas = true; tieneErrores = true; }
    if (this.datos.reparacion === null || this.datos.reparacion === undefined) { this.errores.reparacion = true; tieneErrores = true; }
    if (this.datos.reserva === null || this.datos.reserva === undefined) { this.errores.reserva = true; tieneErrores = true; }

    if (tieneErrores) {
      alert('Por favor, llena todos los campos de los equipos.');
      return; 
    }

    // 3. Preparamos los datos
    const datosParaEnviar = {
      operativas: this.datos.operativas,
      reparacion: this.datos.reparacion,
      reserva: this.datos.reserva
    };

    console.log('Enviando el Paso 1 a NestJS...', datosParaEnviar);

    // 4. Mandamos a guardar usando nuestro servicio (esto crea o actualiza en la BD)
    this.censoService.guardarConteoInicial(datosParaEnviar).subscribe({
      next: (respuesta: any) => {
        console.log('¡Paso 1 guardado exitosamente!', respuesta);

        // 5. OBTENEMOS EL ID REAL QUE GENERÓ LA BASE DE DATOS Y LO GUARDAMOS
        const idReal = respuesta.iddatos || respuesta.id;
        if (idReal) {
          localStorage.setItem('id_censo_actual', idReal.toString());
        }

        // 6. ¡Ahora sí, avanzamos a la siguiente pantalla sin trampas!
        this.router.navigate(['/internet']); 
      },
      error: (err) => {
        console.error('Error al guardar el Paso 1:', err);
        alert('Hubo un problema al conectar con el servidor.');
      }
    });
  }
}