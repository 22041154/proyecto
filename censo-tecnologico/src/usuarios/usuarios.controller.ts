import {
  Controller,
  Post,
  Body,
  BadRequestException,
  ForbiddenException, 
  Get,
  Param,
  UseGuards,
  Patch,
  Delete,
  Request, 
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/auth/admin.guard';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}


  @UseGuards(AuthGuard('jwt'), AdminGuard) 
  @Post('registrar')
  async registrar(
    @Body() body: { 
        usuario: string; 
        contrasena: string; 
        role?: 'superadmin' | 'admin' | 'user'; 
        departamento_id?: number | null; 
      },
    @Request() req: any
  ) {
    const adminLogueado = req.user; 

    if (!body.usuario || !body.contrasena) {
      throw new BadRequestException(
        'Faltan datos: usuario y contrasena son requeridos',
      );
    }

    // --- AQUÍ ESTÁ LA CORRECCIÓN ---
    if (adminLogueado.role === 'admin') {
      if (body.role && body.role !== 'user') {
        throw new ForbiddenException('Un administrador solo puede crear usuarios normales');
      }
      
      // Comparamos usando departamento_id directamente y forzando a Número
      if (Number(body.departamento_id) !== Number(adminLogueado.departamento_id)) {
        throw new ForbiddenException(`Solo puedes registrar usuarios en tu propio departamento.`);
      }
    }
    // -------------------------------

    const existe = await this.usuariosService.encontrarPorNombre(body.usuario);
    if (existe) {
      throw new BadRequestException('El usuario ya existe');
    }

    const created = await this.usuariosService.crear(
      body.usuario,
      body.contrasena,
      body.role || 'user', 
      body.departamento_id || null 
    );
    return this.usuariosService.findOneById(created.id);

  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get()
  async list() {
    return this.usuariosService.findAll();
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.usuariosService.findOneById(+id);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.usuariosService.update(+id, body);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usuariosService.eliminar(+id); 
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch(':id/role')
  async setRole(@Param('id') id: string, @Body() body: { role: 'superadmin' | 'admin' | 'user' }) {
    if (!body.role) throw new BadRequestException('role is required');
    return this.usuariosService.update(+id, { role: body.role } as any);
  }
}