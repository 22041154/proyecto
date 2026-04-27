import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departamento } from 'src/entities/departamento.entity';

@Controller('departamentos')
export class DepartamentosController {
  constructor(
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>,
  ) {}

  @Get()
  async listarTodos() {
    // Devuelve todos los departamentos ordenados por ID
    return await this.departamentoRepository.find({
      order: { id: 'ASC' }
    });
  }
}