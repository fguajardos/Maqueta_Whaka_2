import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { audit } from '../utils/audit';

export class AuthService {
    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.isActive) {
            throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
        }

        const payload = { userId: user.id, email: user.email, role: user.role };

        const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
        const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });

        await audit({
            action: 'login',
            actor: user.email,
            entityType: 'user',
            entityId: user.id,
            sourceSystem: 'panel_admin',
        });

        return {
            token,
            refreshToken,
            user: { id: user.id, email: user.email, nombre: user.nombre, role: user.role },
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };
    }

    static async refresh(refreshToken: string) {
        try {
            const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

            if (!user || !user.isActive) {
                throw new Error('Usuario no encontrado o inactivo');
            }

            const payload = { userId: user.id, email: user.email, role: user.role };
            const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });

            return { token, expiresAt: new Date(Date.now() + 3600000).toISOString() };
        } catch {
            throw Object.assign(new Error('Refresh token inválido'), { statusCode: 401 });
        }
    }

    static async getProfile(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });

        return { id: user.id, email: user.email, nombre: user.nombre, role: user.role };
    }
}
