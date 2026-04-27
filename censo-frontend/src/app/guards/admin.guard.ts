import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('access_token');
    console.log('1. [Angular Guard] Token encontrado:', token ? 'Sí' : 'No');
    
    if (!token) {
      console.log('2. [Angular Guard] No hay token, redirigiendo a login...');
      this.router.navigate(['/login']);
      return false;
    }

    try {
      // Desencriptamos el JWT para ver qué trae adentro
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      console.log('3. [Angular Guard] Payload desencriptado completo:', payload);
      console.log('4. [Angular Guard] Rol detectado:', payload.role);
      
      // Permitimos el acceso si el rol es superadmin O admin
      if (payload.role === 'superadmin' || payload.role === 'admin') {
        console.log('5. [Angular Guard] ¡Acceso PERMITIDO a la pantalla!');
        return true;
      }

      // Si es un 'user' normal, le bloqueamos el paso y le mostramos la alerta
      console.log('5. [Angular Guard] Acceso DENEGADO. El rol no es suficiente.');
      alert('Acceso denegado: se requieren permisos de administrador.');
      this.router.navigate(['/paso1']); // Lo mandamos al formulario en lugar del login
      return false;

    } catch (error) {
      console.error('Error al validar el token en el Guard', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}