import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Departamento } from './departamento.entity'; // Asegúrate de que el nombre del archivo coincida

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  usuario: string;

  @Column()
  contrasena: string;

  @Column({ type: 'enum', enum: ['superadmin', 'admin', 'user'], default: 'user' })
  role: string;

  @ManyToOne(() => Departamento, departamento => departamento.usuarios, { eager: true, nullable: true })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento | null;
}