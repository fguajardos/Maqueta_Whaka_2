import prisma from '../config/database';
import { logger } from '../utils/logger';

export class NotificationsService {
  static async create(data: {
    type: string;
    title: string;
    message: string;
    entityType: string;
    entityId: string;
    recipientEmail: string;
    recipientPhone?: string;
  }) {
    try {
      const notification = await prisma.notification.create({
        data,
      });

      logger.info(`[Notifications] Created: ${data.type} for ${data.entityId}`);

      return {
        success: true,
        notification,
      };
    } catch (error: any) {
      logger.error('[Notifications] Error creating notification:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async getUnread(recipientEmail: string) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          recipientEmail,
          read: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        count: notifications.length,
        notifications,
      };
    } catch (error: any) {
      logger.error('[Notifications] Error getting unread:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      logger.info(`[Notifications] Marked as read: ${notificationId}`);

      return {
        success: true,
        notification: updated,
      };
    } catch (error: any) {
      logger.error('[Notifications] Error marking as read:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async getByEntity(entityType: string, entityId: string) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          entityType,
          entityId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        notifications,
      };
    } catch (error: any) {
      logger.error('[Notifications] Error getting by entity:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async getAll(filters?: { read?: boolean; type?: string }) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          read: filters?.read,
          type: filters?.type,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        count: notifications.length,
        notifications,
      };
    } catch (error: any) {
      logger.error('[Notifications] Error getting all:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async delete(notificationId: string) {
    try {
      await prisma.notification.delete({
        where: { id: notificationId },
      });

      logger.info(`[Notifications] Deleted: ${notificationId}`);

      return { success: true };
    } catch (error: any) {
      logger.error('[Notifications] Error deleting:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
