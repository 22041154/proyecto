import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    
    // --- ESTAS TRES LÍNEAS NOS DIRÁN LA VERDAD ---
    console.log('1. Usuario detectado en NestJS:', user);
    console.log('2. ¿Es admin?', user?.role === 'admin');
    console.log('3. ¿Es superadmin?', user?.role === 'superadmin');
    
    if (user && (user.role === 'admin' || user.role === 'superadmin')) { 
      return true;
    }
    
    throw new ForbiddenException(`Bloqueado. Tu rol actual es: ${user?.role}`);
  }
}