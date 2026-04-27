import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CensoApiService } from '../../services/censo-api';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-usuarios.html',
  styleUrls: ['./admin-usuarios.css']
})
export class AdminUsuariosComponent implements OnInit {
  private censoService = inject(CensoApiService);
  private authService = inject(AuthService);

  usuarios: any[] = [];
  departamentos: any[] = []; 
  
  nuevoUsuario = { 
    usuario: '', 
    contrasena: '', 
    role: 'user', 
    departamento_id: null as number | null 
  };
  
  userLogueado: any = null;
  esSuperAdmin = false;
  cargando = false;

  esAdmin = false; 

  ngOnInit() {
    this.obtenerDatosToken();
    this.obtenerUsuarios();
    this.cargarDepartamentos(); 
  }

  obtenerDatosToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userLogueado = payload;
        this.esSuperAdmin = payload.role === 'superadmin';

        // 👇 2. LE ASIGNAMOS EL VALOR EXACTO AQUÍ 👇
        this.esAdmin = payload.role === 'admin' || payload.role === 'superadmin';

        if (!this.esSuperAdmin) {
          const id = payload.departamento_id || payload.departamento?.id;
          this.nuevoUsuario.departamento_id = id ? Number(id) : null;
          this.nuevoUsuario.role = 'user'; 
        }
      } catch (e) {
        console.error('Error al leer el token', e);
      }
    }
  }

  cargarDepartamentos() {
    this.censoService.obtenerDepartamentosDisponibles().subscribe({
      next: (res: any) => {
        console.log('Departamentos desde la BD:', res); 
        this.departamentos = res.data || res;
      },
      error: () => console.error('Error al cargar la lista de departamentos')
    });
  }

  obtenerUsuarios() {
    this.cargando = true;
    this.censoService.listarUsuarios().subscribe({
      next: (res: any) => {
        let lista = res.data || res.usuarios || res;
        
        if (!this.esSuperAdmin && this.userLogueado) {
          const miDeptoId = this.userLogueado.departamento_id || this.userLogueado.departamento?.id;
          
          this.usuarios = lista.filter((u: any) => {
            const idDeptoUsuario = u.departamento ? u.departamento.id : u.departamento_id;
            return Number(idDeptoUsuario) === Number(miDeptoId); // Aseguramos comparación numérica
          });
        } else {
          this.usuarios = lista;
        }
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  registrar() {
    if (!this.nuevoUsuario.usuario || !this.nuevoUsuario.contrasena || !this.nuevoUsuario.departamento_id) {
      alert('Llena todos los campos, incluyendo el departamento');
      return;
    }

    // Clonamos el objeto y forzamos a que el ID sea numérico para NestJS
    const usuarioAEnviar = {
      ...this.nuevoUsuario,
      departamento_id: Number(this.nuevoUsuario.departamento_id) 
    };

    console.log('Enviando nuevo usuario:', usuarioAEnviar);

    this.censoService.registrarUsuario(usuarioAEnviar).subscribe({
      next: () => {
        alert(`Usuario ${this.nuevoUsuario.usuario} creado con éxito`);
        
        // Obtenemos el ID correcto para mantenerlo si es Admin normal
        const idAdmin = this.userLogueado.departamento_id || this.userLogueado.departamento?.id;

        // Limpiamos el formulario 
        this.nuevoUsuario = { 
          usuario: '', 
          contrasena: '', 
          role: 'user', 
          departamento_id: this.esSuperAdmin ? null : (idAdmin ? Number(idAdmin) : null)
        };
        
        this.obtenerUsuarios();
      },
      error: (e) => alert('Error al registrar usuario')
    });
  }

  eliminar(id: number) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.censoService.eliminarUsuario(id).subscribe({
        next: () => this.obtenerUsuarios(),
        error: () => alert('Error al eliminar')
      });
    }
  }

  cerrarSesion() {
    this.authService.logout();
  }
}