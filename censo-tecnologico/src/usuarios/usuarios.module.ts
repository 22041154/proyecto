import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from 'src/entities/Usuario.entity';
import { Departamento } from 'src/entities/departamento.entity'; // Ajusta la ruta
import { DepartamentosController } from 'src/departamentos/departamentos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Departamento])], 
  controllers: [UsuariosController, DepartamentosController], 
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
