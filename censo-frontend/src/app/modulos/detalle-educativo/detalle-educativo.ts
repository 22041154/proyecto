import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CensoApiService } from '../../../app/services/censo-api';

@Component({
  selector: 'app-detalle-educativo',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './detalle-educativo.html',
  styleUrls: ['./detalle-educativo.css']
})
export class DetalleEducativoComponent implements OnInit {
  
  private censoService = inject(CensoApiService);
  private router = inject(Router);
  idActual: number | null = null;

  catalogos: any = {
    ram: [], so: [], discos: [], antiguedades: [], tipos: []
  };
  totales = { ram: 0, so: 0, discos: 0, antiguedades: 0, tipos: 0 };

  ngOnInit() {
    const id = localStorage.getItem('id_censo_actual');
    if (id) {
      this.idActual = +id;
      this.cargarCatalogos();
    } else {
      alert('No hay sesión de censo activa.');
      this.router.navigate(['/']);
    }
  }

  cargarCatalogos() {
    this.censoService.obtenerCatalogos().subscribe({
      next: (data: any) => { 
        this.catalogos.ram = data.ram?.map((i: any) => ({ ...i, cantidad: 0 })) || [];
        this.catalogos.so = data.so?.map((i: any) => ({ ...i, cantidad: 0 })) || [];
        this.catalogos.discos = data.discos?.map((i: any) => ({ ...i, cantidad: 0 })) || [];
        this.catalogos.antiguedades = data.antiguedades?.map((i: any) => ({ ...i, cantidad: 0 })) || [];
        this.catalogos.tipos = data.tipos?.map((i: any) => ({ ...i, cantidad: 0 })) || [];
      },
      error: (e: any) => {
        console.error('Error cargando catálogos Paso 3', e);
        alert('Error de conexión con el servidor.');
      }
    });
  }

  calcularTotal(lista: any[], llave: string) {
    (this.totales as any)[llave] = lista.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  }

  guardar() {
    if (!this.idActual) {
        alert('Error: No se encontró el ID del censo actual. Regresa al inicio.');
        return;
    }

    const base = this.totales.tipos;
    
    // Validación de coherencia
    if (base === 0) {
        alert('Debes registrar al menos una computadora.');
        return;
    }
    
    if (this.totales.ram !== base || this.totales.so !== base || 
        this.totales.discos !== base || this.totales.antiguedades !== base) {
        alert(`ERROR DE COHERENCIA:\nReportaste ${base} computadoras en total, pero la suma de RAM, Discos o Antigüedad no coincide.`);
        return;
    }

    // El Payload estructura las relaciones OneToMany exactas que espera NestJS
    const payload = {
      iddatos: Number(this.idActual),
      conteosTipo: this.catalogos.tipos.filter((i:any)=>i.cantidad>0).map((i:any) => ({
          tipoComputadora: { idtipocomputadora: i.idtipocomputadora }, 
          cantidad: i.cantidad
      })),
      conteosRam: this.catalogos.ram.filter((i:any)=>i.cantidad>0).map((i:any) => ({
          memoriaRam: { idram: i.idram }, 
          cantidad: i.cantidad
      })),
      conteosSO: this.catalogos.so.filter((i:any)=>i.cantidad>0).map((i:any) => ({
          sistemaOperativo: { idsistema: i.idsistema }, 
          cantidad: i.cantidad
      })),
      conteosDisco: this.catalogos.discos.filter((i:any)=>i.cantidad>0).map((i:any) => ({
          capacidadDisco: { idcapacidad: i.idcapacidad }, 
          cantidad: i.cantidad
      })),
      conteosAntiguedad: this.catalogos.antiguedades.filter((i:any)=>i.cantidad>0).map((i:any) => ({
          antiguedad: { idantiguedad: i.idantiguedad }, 
          cantidad: i.cantidad
      }))
    };

    console.log('Enviando conteos de hardware al servidor...', payload);

    this.censoService.actualizarDatos(this.idActual, payload).subscribe({
      next: () => {
        console.log('Catálogos guardados con éxito.');
        this.router.navigate(['/conectividad']); 
      },
      error: (e) => {
        console.error('Error detallado del servidor:', e);
        const errorMessage = e?.error?.message || 'Error de integridad en la base de datos.';
        alert(`Error al guardar: ${errorMessage}`);
      }
    });
  }
}