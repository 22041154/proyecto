import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CensoApiService } from '../../services/censo-api';

@Component({
  selector: 'app-conectividad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conectividad.html',
  styleUrls: ['./conectividad.css']
})
export class Conectividad implements OnInit {

  private censoService = inject(CensoApiService);
  private router = inject(Router);
  idActual: number | null = null;

  catalogos = {
    adquisiciones: [] as any[],
    medios: [] as any[],
    velocidades: [] as any[]
  };

  datos = {
    adquisicion: {} as any, 
    totalAdquisicion: 0,
    conInternet: 0,
    sinInternet: 0,
    mediosSeleccionados: {} as any,
    velocidadesSeleccionadas: {} as any
  };

  ngOnInit() {
    const id = localStorage.getItem('id_censo_actual');
    if (id) {
      this.idActual = +id;
      this.cargarCatalogos();
    } else {
      this.router.navigate(['/']);
    }
  }

  cargarCatalogos() {
    this.censoService.obtenerCatalogosPaso4().subscribe({
      next: (res: any) => {
        this.catalogos.adquisiciones = res.adquisiciones || [];
        this.catalogos.medios = res.medios || [];
        this.catalogos.velocidades = res.velocidades || [];
        
        // Inicializar adquisición
        this.catalogos.adquisiciones.forEach(a => this.datos.adquisicion[a.id] = 0);
      },
      error: (e) => console.error('Error cargando catálogos P4', e)
    });
  }

  calcularTotalAdquisicion() {
    let suma = 0;
    Object.values(this.datos.adquisicion).forEach((val: any) => suma += Number(val || 0));
    this.datos.totalAdquisicion = suma;
  }

  guardar() {
    // 1. Verificamos que no se hayan saltado los pasos anteriores
    if (!this.idActual) {
      alert('Error: No se encontró el progreso del censo. Por favor, regresa al Paso 1.');
      return;
    }

    // 2. Validación: Confirmar si realmente no hay equipos nuevos adquiridos
    if (this.datos.totalAdquisicion === 0) {
        if(!confirm('Has marcado 0 equipos en total de adquisición. ¿Estás seguro de continuar?')) {
          return; // Si el usuario cancela, no avanzamos
        }
    }

    console.log('Preparando datos de conectividad y adquisición para enviar...');

    // 3. Preparamos el Payload con la estructura exacta que espera NestJS
    const payload = {
      // Relación OneToMany: Adquisición
      conteosAdquisicion: this.catalogos.adquisiciones
        .filter(item => this.datos.adquisicion[item.id] > 0)
        .map(item => ({
            tipoAdquisicion: { id: item.id },
            cantidad: this.datos.adquisicion[item.id]
        })),

      // Campos normales: Red 
      computadorasConInternet: this.datos.conInternet || 0,
      computadorasSinInternet: this.datos.sinInternet || 0,

      // Relación ManyToMany: Checkboxes (Medios de conexión)
      mediosConexionSeleccionados: this.catalogos.medios
        .filter(m => this.datos.mediosSeleccionados[m.id])
        .map(m => ({ id: m.id })),

      // Relación ManyToMany: Checkboxes (Velocidades)
      velocidadesInternetSeleccionadas: this.catalogos.velocidades
        .filter(v => this.datos.velocidadesSeleccionadas[v.id])
        .map(v => ({ id: v.id }))
    };

    console.log('Payload a enviar:', payload);

    // 4. Llamamos a NestJS para que actualice la base de datos
    this.censoService.actualizarDatos(this.idActual, payload).subscribe({
      next: () => {
        console.log('¡Paso 4 guardado exitosamente en la BD!');
        
        // 5. Avanzamos al último paso
        this.router.navigate(['/servicios']);
      },
      error: (e) => {
        console.error('Error guardando Paso 4:', e);
        alert('Hubo un problema al guardar la información de conectividad. Revisa la consola para más detalles.');
      }
    });
  }
}