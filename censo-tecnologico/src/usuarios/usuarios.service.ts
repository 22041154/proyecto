import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common'; 
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from 'src/entities/Usuario.entity'; 
import { Departamento } from 'src/entities/departamento.entity'; // Asegúrate de tener esta ruta
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService implements OnModuleInit { 
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,

    @InjectRepository(Departamento)
    private departamentoRepository: Repository<Departamento>,
  ) {}

  async onModuleInit() {
    // 1. LISTA DE DEPARTAMENTOS DEL TECNOLÓGICO
    const departamentosITD = [
      // Áreas Académicas
      'Sistemas y Computación',
      'Ciencias Económico-Administrativas',
      'Metal-Mecánica',
      'Química-Bioquímica',
      'Ciencias Básicas',
      'Ciencias de la Tierra',
      'Eléctrica - Electrónica',
      'Ingeniería Industrial',
      // Departamentos Administrativos
      'Centro de Cómputo',
      'Recursos Financieros',
      'Recursos Humanos',
      'Recursos Materiales y Servicios',
      'Mantenimiento y Equipo',
      // Áreas de Planeación y Vinculación
      'Comunicación y Difusión',
      'Gestión Tecnológica y Vinculación',
      'Servicios Escolares',
      'Planeación, Programación y Presupuestación',
      'Centro de Información',
      'Actividades Extraescolares'
    ];

    // 2. SEMBRAR DEPARTAMENTOS (Iteramos la lista y los guardamos si no existen)
    for (const nombre of departamentosITD) {
      const existe = await this.departamentoRepository.findOne({ where: { nombre } });
      if (!existe) {
        const nuevoDepto = this.departamentoRepository.create({ nombre });
        await this.departamentoRepository.save(nuevoDepto);
      }
    }
    console.log('Departamentos verificados/sincronizados correctamente.');

    // 3. VERIFICAR Y CREAR SUPERADMIN
    const superAdminUsuario = 'superadmin';
    const superAdminPassword = 'pass123'; 
    const superAdminExiste = await this.encontrarPorNombre(superAdminUsuario);
    
    if (!superAdminExiste) {
      // Como es superadmin, no lo atamos a ningún departamento (pasamos null al final)
      await this.crear(superAdminUsuario, superAdminPassword, 'superadmin', null);
      console.log('Superadmin creado por defecto.');
    }
  }

  async encontrarPorNombre(usuario: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { usuario } });
  }

  async crear(
    usuario: string,
    contrasena: string,
    role: 'superadmin' | 'admin' | 'user' = 'user',
    departamento_id: number | null = null
  ): Promise<Usuario> {
    
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(contrasena, salt);

    // Tipamos explícitamente la variable para quitar el error del create
    let departamentoAsignado: Departamento | null = null;

    if (departamento_id) {
      departamentoAsignado = await this.departamentoRepository.findOne({
        where: { id: departamento_id }
      });

      if (!departamentoAsignado) {
        throw new NotFoundException(`El departamento con ID ${departamento_id} no existe.`);
      }
    }

    const nuevoUsuario = this.usuarioRepository.create({
      usuario,
      contrasena: hash,
      role,
      departamento: departamentoAsignado 
    });

    return this.usuarioRepository.save(nuevoUsuario);
  }


  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find({ relations: ['departamento'] });
  }

  async findOneById(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
       where: { id },
       relations: ['departamento']
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async update(id: number, body: any): Promise<Usuario> {
    await this.usuarioRepository.update(id, body);
    return this.findOneById(id);
  }

  async eliminar(id: number): Promise<void> {
    await this.usuarioRepository.delete(id);
  }
}