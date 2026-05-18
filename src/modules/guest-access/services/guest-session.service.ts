import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { GuestAccessSettingsService } from './guest-access-settings.service';
import { GuestCapabilitiesService } from './guest-capabilities.service';
import { GuestSessionRepository } from '../repositories/guest-session.repository';
@Injectable()
export class GuestSessionService { constructor(private readonly jwtService:JwtService,private readonly config:ConfigService,private readonly settings:GuestAccessSettingsService,private readonly capabilities:GuestCapabilitiesService,private readonly sessions:GuestSessionRepository){} async create(ipAddress?:string,userAgent?:string|string[]){const settings=await this.settings.getSettings();const capabilities=this.capabilities.capabilities(settings);const expiresAt=new Date(Date.now()+settings.sessionTtlMinutes*60_000);const session=await this.sessions.create({capabilitiesJson:capabilities,ipAddress,userAgent:Array.isArray(userAgent)?userAgent.join(' '):userAgent,expiresAt});const accessToken=await this.jwtService.signAsync({uid:session.id,role:UserRole.GUEST_USER,guestSessionId:session.id,capabilities},{secret:this.config.get<string>('JWT_ACCESS_SECRET','change-me-access'),expiresIn:`${settings.sessionTtlMinutes}m` as never});return{data:{guestSessionId:session.id,accessToken,role:UserRole.GUEST_USER,capabilities,expiresAt},message:'Guest session created successfully.'};} }
