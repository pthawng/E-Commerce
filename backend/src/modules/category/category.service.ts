import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { slugify } from 'src/common/utils/string.helper';
import type { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type FlatCategory = Prisma.CategoryGetPayload<{
  select: {
    id: true;
    parentId: true;
    name: true;
    slug: true;
    isActive: true;
    order: true;
    path: true;
    level: true;
  };
}>;

export type CategoryTreeNode = FlatCategory & { children: CategoryTreeNode[] };

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // TREE VIEW (optionally include inactive)
  async findTree(includeInactive = false): Promise<CategoryTreeNode[]> {
    const categories = await this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ order: 'asc' }, { slug: 'asc' }],
    });

    return this.buildTree(categories);
  }

  // DETAIL BY ID
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // DETAIL BY SLUG
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // CREATE
  async create(dto: CreateCategoryDto) {
    const mainName = dto.name?.['vi'] || dto.name?.['en'] || Object.values(dto.name ?? {})[0];
    if (!mainName) {
      throw new BadRequestException('Tên danh mục phải có ít nhất một ngôn ngữ');
    }

    // Validate parent if provided
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new BadRequestException('Danh mục cha không tồn tại');
      }
    }

    const finalSlug = await this.generateUniqueSlug(dto.slug || slugify(mainName));

    const created = await this.prisma.category.create({
      data: {
        name: dto.name as Prisma.InputJsonValue,
        slug: finalSlug,
        parentId: dto.parentId ?? null,
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
      },
    });

    // Rebuild path/level to keep tree metadata consistent
    await this.rebuildPaths();

    return this.findOne(created.id);
  }

  // UPDATE
  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    // Parent validation
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('Không thể đặt danh mục làm cha của chính nó');
      }

      if (dto.parentId) {
        const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
        if (!parent) {
          throw new BadRequestException('Danh mục cha không tồn tại');
        }

        const categories = await this.prisma.category.findMany({
          select: { id: true, parentId: true },
        });
        const isLoop = this.isParentLoop(id, dto.parentId, categories);
        if (isLoop) {
          throw new BadRequestException('Không thể chuyển danh mục vào chính nhánh con của nó');
        }
      }
    }

    // Slug handling
    let finalSlug = existing.slug;
    if (dto.slug) {
      finalSlug = slugify(dto.slug);
    } else if (dto.name) {
      const mainName = dto.name?.['vi'] || dto.name?.['en'] || Object.values(dto.name ?? {})[0];
      if (mainName) {
        finalSlug = slugify(mainName);
      }
    }

    if (finalSlug !== existing.slug) {
      finalSlug = await this.generateUniqueSlug(finalSlug, id);
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name ? (dto.name as Prisma.InputJsonValue) : undefined,
        slug: finalSlug,
        parentId: dto.parentId !== undefined ? dto.parentId : undefined,
        isActive: dto.isActive ?? undefined,
        order: dto.order ?? undefined,
      },
    });

    await this.rebuildPaths();

    return this.findOne(updated.id);
  }

  // DELETE
  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    await this.prisma.category.delete({ where: { id } });
    await this.rebuildPaths();

    return { message: 'Đã xoá danh mục', id };
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  private buildTree(categories: FlatCategory[]): CategoryTreeNode[] {
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    categories.forEach((c) =>
      map.set(c.id, {
        ...c,
        children: [],
      }),
    );

    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortChildren = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
      nodes.forEach((child) => sortChildren(child.children));
    };
    sortChildren(roots);

    return roots;
  }

  private async generateUniqueSlug(baseSlug: string, ignoreId?: string) {
    let slug = baseSlug;
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) {
      return slug;
    }

    let counter = 1;
    while (true) {
      const candidate = `${baseSlug}-${counter}`;
      const found = await this.prisma.category.findUnique({ where: { slug: candidate } });
      if (!found || found.id === ignoreId) {
        slug = candidate;
        break;
      }
      counter++;
    }

    return slug;
  }

  private isParentLoop(
    currentId: string,
    newParentId: string,
    categories: { id: string; parentId: string | null }[],
  ) {
    // đi lên từ newParentId, nếu gặp currentId -> tạo vòng lặp
    let cursor: string | null | undefined = newParentId;
    const parentMap = new Map(categories.map((c) => [c.id, c.parentId]));

    while (cursor) {
      if (cursor === currentId) return true;
      cursor = parentMap.get(cursor) ?? null;
    }

    return false;
  }

  private async rebuildPaths() {
    const categories = await this.prisma.category.findMany({
      select: { id: true, parentId: true, slug: true },
      orderBy: [{ order: 'asc' }, { slug: 'asc' }],
    });

    const childrenMap = new Map<
      string | null,
      { id: string; parentId: string | null; slug: string }[]
    >();
    categories.forEach((c) => {
      const list = childrenMap.get(c.parentId ?? null) ?? [];
      list.push(c);
      childrenMap.set(c.parentId ?? null, list);
    });

    const updates: { id: string; path: string; level: number }[] = [];

    const dfs = (
      node: { id: string; parentId: string | null; slug: string },
      parentPath: string | null,
      level: number,
    ) => {
      const path = parentPath ? `${parentPath}/${node.slug}` : node.slug;
      updates.push({ id: node.id, path, level });

      const children = childrenMap.get(node.id) ?? [];
      children.forEach((child) => dfs(child, path, level + 1));
    };

    const roots = childrenMap.get(null) ?? [];
    roots.forEach((root) => dfs(root, null, 0));

    if (updates.length) {
      await this.prisma.$transaction(
        updates.map((u) =>
          this.prisma.category.update({
            where: { id: u.id },
            data: { path: u.path, level: u.level },
          }),
        ),
      );
    }
  }
}
