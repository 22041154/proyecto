import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatosEscuela } from '../entities/DatosEscuela.entity';
import { ConteoAdquisicion } from '../entities/conteo-adquisicion.entity';
import { ConteoMemoriaRam } from '../entities/conteo-memoria-ram.entity';
import { ConteoSistemaOperativo } from '../entities/conteo-sistema-operativo.entity';
import { ConteoCapacidadDisco } from '../entities/conteo-capacidad-disco.entity';
import { ConteoAntiguedad } from '../entities/conteo-antiguedad.entity';
import { ConteoTipoComputadora } from '../entities/conteo-tipo-computadora.entity';

@Injectable()
export class DatosEscuelaService {
  constructor(
    @InjectRepository(DatosEscuela)
    private repo: Repository<DatosEscuela>,
    @InjectRepository(ConteoAdquisicion)
    private conteoAdquisicionRepo: Repository<ConteoAdquisicion>,
    @InjectRepository(ConteoMemoriaRam)
    private conteoRamRepo: Repository<ConteoMemoriaRam>,
    @InjectRepository(ConteoSistemaOperativo)
    private conteoSORepo: Repository<ConteoSistemaOperativo>,
    @InjectRepository(ConteoCapacidadDisco)
    private conteoDisco: Repository<ConteoCapacidadDisco>,
    @InjectRepository(ConteoAntiguedad)
    private conteoAntiguedadRepo: Repository<ConteoAntiguedad>,
    @InjectRepository(ConteoTipoComputadora)
    private conteoTipoRepo: Repository<ConteoTipoComputadora>,
  ) {}

  async guardar(data: any, departamentoId: number) {
    const existe = await this.repo.findOne({ 
      where: { departamento: { id: departamentoId } } 
    });
    
    if (existe) {
      await this.repo.update(existe.iddatos, { ...data });
      return { iddatos: existe.iddatos, ...data }; 
    } else {
      const nuevo = this.repo.create({ 
        ...data, 
        departamento: { id: departamentoId } 
      });
      return await this.repo.save(nuevo);
    }
  }

  async actualizar(id: number, datos: any) {
    try {
      const { 
        conteosTipo, conteosRam, conteosSO, conteosDisco, conteosAntiguedad,
        mediosConexionSeleccionados: medios,
        velocidadesInternetSeleccionadas: velocidades,
        perfilesWifiSeleccionados: perfiles,
        conteosAdquisicion
      } = datos;
      
      // Limpiar datos para actualización simple
      const datosSimples = { ...datos };
      const keysToDelete = [
        'conteosTipo', 'conteosRam', 'conteosSO', 'conteosDisco', 
        'conteosAntiguedad', 'mediosConexionSeleccionados', 
        'velocidadesInternetSeleccionadas', 'perfilesWifiSeleccionados', 
        'conteosAdquisicion'
      ];
      keysToDelete.forEach(key => delete datosSimples[key]);

      await this.repo.update(id, datosSimples);

      // Actualización de relaciones Paso 3 (Tipos, RAM, SO, Discos, Antigüedad)
      const censoRel = { iddatos: id };
      
      if (Array.isArray(conteosTipo)) {
        await this.conteoTipoRepo.delete({ censo: censoRel });
        if (conteosTipo.length > 0) {
          await this.conteoTipoRepo.insert(conteosTipo.map(c => ({
            cantidad: c.cantidad, censo: censoRel, tipoComputadora: { idtipocomputadora: c.tipoComputadora.idtipocomputadora }
          })));
        }
      }

      if (Array.isArray(conteosRam)) {
        await this.conteoRamRepo.delete({ censo: censoRel });
        if (conteosRam.length > 0) {
          await this.conteoRamRepo.insert(conteosRam.map(c => ({
            cantidad: c.cantidad, censo: censoRel, memoriaRam: { idram: c.memoriaRam.idram }
          })));
        }
      }

      if (Array.isArray(conteosSO)) {
        await this.conteoSORepo.delete({ censo: censoRel }); // Corrección nombre repo
        if (conteosSO.length > 0) {
          await this.conteoSORepo.insert(conteosSO.map(c => ({
            cantidad: c.cantidad, censo: censoRel, sistemaOperativo: { idsistema: c.sistemaOperativo.idsistema }
          })));
        }
      }

      if (Array.isArray(conteosDisco)) {
        await this.conteoDisco.delete({ censo: censoRel });
        if (conteosDisco.length > 0) {
          await this.conteoDisco.insert(conteosDisco.map(c => ({
            cantidad: c.cantidad, censo: censoRel, capacidadDisco: { idcapacidad: c.capacidadDisco.idcapacidad }
          })));
        }
      }

      if (Array.isArray(conteosAntiguedad)) {
        await this.conteoAntiguedadRepo.delete({ censo: censoRel });
        if (conteosAntiguedad.length > 0) {
          await this.conteoAntiguedadRepo.insert(conteosAntiguedad.map(c => ({
            cantidad: c.cantidad, censo: censoRel, antiguedad: { idantiguedad: c.antiguedad.idantiguedad }
          })));
        }
      }

      // Actualizar relaciones ManyToMany (Paso 4 y 5)
      if (medios || velocidades || perfiles) {
        const registro = await this.repo.findOne({ 
          where: { iddatos: id },
          relations: ['mediosConexionSeleccionados', 'velocidadesInternetSeleccionadas', 'perfilesWifiSeleccionados']
        });

        if (registro) {
          if (medios) registro.mediosConexionSeleccionados = medios;
          if (velocidades) registro.velocidadesInternetSeleccionadas = velocidades;
          if (perfiles) registro.perfilesWifiSeleccionados = perfiles;
          await this.repo.save(registro);
        }
      }
      
      // Actualizar Paso 4 (Adquisición)
      if (Array.isArray(conteosAdquisicion)) {
        await this.conteoAdquisicionRepo.delete({ datosEscuela: censoRel });
        if (conteosAdquisicion.length > 0) {
          await this.conteoAdquisicionRepo.insert(conteosAdquisicion.map(c => ({
            cantidad: c.cantidad, datosEscuela: censoRel, tipoAdquisicion: { id: c.tipoAdquisicion.id }
          })));
        }
      }

      return await this.findOne(id);
    } catch (error) {
      console.error('Error en actualización masiva:', error);
      throw error;
    }
  }

  // BUSCA POR DEPARTAMENTO PARA COMPARTIR PROGRESO
  async buscarPorDepartamento(departamentoId: number) {
    return await this.repo
      .createQueryBuilder('datos')
      .leftJoinAndSelect('datos.departamento', 'departamento')
      .leftJoinAndSelect('datos.conteosRam', 'conteosRam')
      .leftJoinAndSelect('datos.conteosSO', 'conteosSO')
      .leftJoinAndSelect('datos.conteosDisco', 'conteosDisco')
      .leftJoinAndSelect('datos.conteosAntiguedad', 'conteosAntiguedad')
      .leftJoinAndSelect('datos.conteosTipo', 'conteosTipo')
      .leftJoinAndSelect('datos.conteosAdquisicion', 'conteosAdquisicion')
      .leftJoinAndSelect('conteosAdquisicion.tipoAdquisicion', 'tipoAdquisicion')
      .leftJoinAndSelect('datos.mediosConexionSeleccionados', 'mediosConexionSeleccionados')
      .leftJoinAndSelect('datos.velocidadesInternetSeleccionadas', 'velocidadesInternetSeleccionadas')
      .leftJoinAndSelect('datos.perfilesWifiSeleccionados', 'perfilesWifiSeleccionados')
      .where('departamento.id = :departamentoId', { departamentoId })
      .getOne();
  }

  async findOne(id: number) {
    return await this.repo.createQueryBuilder('datos')
      .leftJoinAndSelect('datos.departamento', 'departamento')
      
      .leftJoinAndSelect('datos.conteosRam', 'conteosRam')
      .leftJoinAndSelect('conteosRam.memoriaRam', 'memoriaRam') 
      
      .leftJoinAndSelect('datos.conteosSO', 'conteosSO')
      .leftJoinAndSelect('conteosSO.sistemaOperativo', 'sistemaOperativo') 
      
      .leftJoinAndSelect('datos.conteosDisco', 'conteosDisco')
      .leftJoinAndSelect('conteosDisco.capacidadDisco', 'capacidadDisco')
      
      .leftJoinAndSelect('datos.conteosTipo', 'conteosTipo')
      .leftJoinAndSelect('conteosTipo.tipoComputadora', 'tipoComputadora')
      
      .leftJoinAndSelect('datos.conteosAntiguedad', 'conteosAntiguedad')
      .leftJoinAndSelect('conteosAntiguedad.antiguedad', 'antiguedad')
      
      .leftJoinAndSelect('datos.conteosAdquisicion', 'conteosAdquisicion')
      .leftJoinAndSelect('conteosAdquisicion.tipoAdquisicion', 'tipoAdquisicion')
      
      .leftJoinAndSelect('datos.mediosConexionSeleccionados', 'mediosConexionSeleccionados')
      .leftJoinAndSelect('datos.velocidadesInternetSeleccionadas', 'velocidadesInternetSeleccionadas')
      
      .where('datos.iddatos = :id', { id })
      .getOne();
  }
  async obtenerDepartamentosDisponibles() {
    const todosLosDepartamentos = [
      '-- Departamentos Académicos --',
      'Sistemas y Computación',
      'Ciencias Económico-Administrativo',
      // ... (aquí van todos los demás que ya tenías)
      'Departamento de Actividades Extraescolares'
    ];

    const departamentosEnUso = await this.repo
      .createQueryBuilder('datos')
      .select('DISTINCT datos.departamento', 'departamento')
      .where('datos.departamento IS NOT NULL')
      .getRawMany();

    const departamentosEnUsoNombres = departamentosEnUso.map(d => d.departamento);

    const departamentosDisponibles = todosLosDepartamentos.filter(depto => {
      if (depto.startsWith('--')) return true; 
      return !departamentosEnUsoNombres.includes(depto); 
    });

    return departamentosDisponibles;
  }
}