// pe-api/src/teams/teams.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/jwt.strategy';
import { GetUser } from '../common/decorators/get-user.decorator';

interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

const multerOptions = {
  storage: diskStorage({
    destination: './uploads/teams',
    filename: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
      return cb(
        new BadRequestException('Solo se permiten imágenes JPEG o PNG.'),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
};

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo', multerOptions))
  async createTeam(
    @Body('name') name: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @GetUser('id') ownerId: string,
  ) {
    if (!name || name.trim().length < 3) {
      throw new BadRequestException(
        'El nombre del equipo es obligatorio y debe tener al menos 3 caracteres.',
      );
    }

    const logoUrl = file ? `/uploads/teams/${file.filename}` : undefined;

    return await this.teamsService.createWithOwner(
      { name: name.trim(), logo_url: logoUrl },
      ownerId,
    );
  }

  @Get('my-team')
  @UseGuards(JwtAuthGuard)
  async getMyTeam(@Req() req: AuthenticatedRequest) {
    return await this.teamsService.findByMember(req.user.id);
  }

  @Get()
  async findAll() {
    return await this.teamsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.teamsService.findOne(id);
  }

  @Get(':id/members')
  async getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return await this.teamsService.getMembers(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo', multerOptions))
  async updateTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('name') name: string | undefined,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const logoUrl = file ? `/uploads/teams/${file.filename}` : undefined;

    return await this.teamsService.update(id, {
      ...(name ? { name: name.trim() } : {}),
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.teamsService.remove(id);
  }

  @Delete(':teamId/members/:memberId')
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.teamsService.removeMember(teamId, req.user.id, memberId);
  }

  @Post('leave')
  @UseGuards(JwtAuthGuard)
  async leaveTeam(@Req() req: AuthenticatedRequest) {
    return await this.teamsService.leaveTeam(req.user.id);
  }
}
