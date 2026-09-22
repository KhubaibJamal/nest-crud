import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Product } from './entities/product.entity.js';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) { }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const { name, description, price, images, status } = createProductDto;

    return this.prisma.product.create({
      data: {
        name,
        description,
        price,
        images,
        status: status ?? true,
      },
    });
  }

  async findAllProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async updateProductById(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    await this.findProductById(id);

    const { name, description, price, images, status } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(images !== undefined && { images }),
        ...(status !== undefined && { status }),
      },
    });
  }

  async removeProductById(id: string): Promise<Product> {
    await this.findProductById(id);

    return this.prisma.product.delete({ where: { id } });
  }
}
