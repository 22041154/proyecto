import { Controller, Post, Body, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DatosEscuelaService } from './datos-escuela.service';

@Controller('datos-escuela')
@UseGuards(AuthGuard('jwt')) 
export class DatosEscuelaController {
  constructor(private readonly service: DatosEscuelaService) {}

  @Post() 
  async guardarDatosEscuela(@Body() body: any, @Req() req: any) {
    const departamentoId = req.user.departamento_id;
    return await this.service.guardar(body, departamentoId);
  }

  @Get('mi-progreso')
  async obtenerMiProgreso(@Req() req: any) {
    const idDepartamento = req.user.departamento_id;
    const progreso = await this.service.buscarPorDepartamento(idDepartamento);
    return progreso || null;
  }

  @Get('disponibles/departamentos')
  async obtenerDepartamentosDisponibles() {
    return await this.service.obtenerDepartamentosDisponibles();
  }

  @Get(':id') 
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(+id);
  }

  @Patch(':id') 
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.service.actualizar(+id, body);
  }
}