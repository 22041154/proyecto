import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'CLAVE_SECRETA_PARA_FIRMAR_TOKENS', // (Asegúrate de que sea el mismo de tu AuthModule)
    });
  }

  // ESTA ES LA FUNCIÓN CRÍTICA
  async validate(payload: any) {
    // Lo que devuelvas aquí, es lo que NestJS guarda en "req.user"
    return { 
      id: payload.sub || payload.id, 
      usuario: payload.usuario, 
      
      // ¡ESTAS DOS LÍNEAS SON LAS QUE FALTABAN PARA QUE EL GUARD FUNCIONE!
      role: payload.role, 
      departamento_id: payload.departamento_id 
    };
  }
}