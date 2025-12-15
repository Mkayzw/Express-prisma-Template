import { PrismaClient } from '@prisma/client';
import { prisma } from '../db/client';

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CrudOptions<T> {
    model: keyof PrismaClient;
    defaultSelect?: Record<string, boolean>;
    searchFields?: string[];
    softDelete?: boolean;
    softDeleteField?: string;
}

export function createCrudService<T, CreateDTO, UpdateDTO>(options: CrudOptions<T>) {
    const { model, defaultSelect, searchFields = [], softDelete = false, softDeleteField = 'deletedAt' } = options;

    // Get the Prisma model delegate
    const getDelegate = () => (prisma as any)[model];

    const findAll = async (
        params: PaginationParams & { search?: string } = {}
    ): Promise<PaginatedResult<T>> => {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        // Add soft delete filter
        if (softDelete) {
            where[softDeleteField] = null;
        }

        // Add search filter
        if (search && searchFields.length > 0) {
            where.OR = searchFields.map((field) => ({
                [field]: { contains: search, mode: 'insensitive' },
            }));
        }

        const [data, total] = await Promise.all([
            getDelegate().findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: defaultSelect,
            }),
            getDelegate().count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    };

    const findById = async (id: string): Promise<T | null> => {
        const where: any = { id };
        if (softDelete) {
            where[softDeleteField] = null;
        }

        return getDelegate().findFirst({
            where,
            select: defaultSelect,
        });
    };

    const findOne = async (where: Record<string, unknown>): Promise<T | null> => {
        if (softDelete) {
            (where as any)[softDeleteField] = null;
        }

        return getDelegate().findFirst({
            where,
            select: defaultSelect,
        });
    };

    const create = async (data: CreateDTO): Promise<T> => {
        return getDelegate().create({
            data,
            select: defaultSelect,
        });
    };

    const update = async (id: string, data: UpdateDTO): Promise<T> => {
        return getDelegate().update({
            where: { id },
            data,
            select: defaultSelect,
        });
    };

    const remove = async (id: string): Promise<void> => {
        if (softDelete) {
            await getDelegate().update({
                where: { id },
                data: { [softDeleteField]: new Date() },
            });
        } else {
            await getDelegate().delete({
                where: { id },
            });
        }
    };

    const exists = async (id: string): Promise<boolean> => {
        const count = await getDelegate().count({
            where: { id },
        });
        return count > 0;
    };

    const count = async (where?: Record<string, unknown>): Promise<number> => {
        const fullWhere = { ...where };
        if (softDelete) {
            (fullWhere as any)[softDeleteField] = null;
        }
        return getDelegate().count({ where: fullWhere });
    };

    return {
        findAll,
        findById,
        findOne,
        create,
        update,
        remove,
        exists,
        count,
    };
}
