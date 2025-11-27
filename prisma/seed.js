import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Seed initial products
    const products = [
        {
            name: 'Premium Tissue Rolls',
            category: 'Tissue',
            description: 'High quality 2-ply tissue rolls suitable for commercial use.',
            sku: 'TIS-001',
            moq: 100,
            retailPrice: 24.99,
            wholesalePrice: 18.99,
            stockQuantity: 5000,
            imageUrl: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Commercial Paper Towels',
            category: 'Paper Towels',
            description: 'Absorbent and durable paper towels for high-traffic areas.',
            sku: 'PT-002',
            moq: 50,
            retailPrice: 32.99,
            wholesalePrice: 24.99,
            stockQuantity: 3000,
            imageUrl: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Nitrile Gloves Medium',
            category: 'Gloves',
            description: 'Powder-free nitrile exam gloves, medium size.',
            sku: 'GLV-003',
            moq: 200,
            retailPrice: 45.99,
            wholesalePrice: 34.99,
            stockQuantity: 10000,
            imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Heavy Duty Garbage Bags',
            category: 'Garbage Bags',
            description: 'Tear-resistant heavy duty trash bags for industrial use.',
            sku: 'GB-004',
            moq: 150,
            retailPrice: 28.99,
            wholesalePrice: 21.99,
            stockQuantity: 4000,
            imageUrl: 'https://images.unsplash.com/photo-1622161687343-828e5422501b?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Disposable Underpads',
            category: 'Underpads',
            description: 'Highly absorbent disposable underpads for protection.',
            sku: 'UND-005',
            moq: 100,
            retailPrice: 38.99,
            wholesalePrice: 29.99,
            stockQuantity: 2000,
            imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Paper Coffee Cups',
            category: 'Cups',
            description: 'Double-wall paper cups suitable for hot beverages.',
            sku: 'CUP-006',
            moq: 300,
            retailPrice: 19.99,
            wholesalePrice: 14.99,
            stockQuantity: 15000,
            imageUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Kraft Paper Bags Large',
            category: 'Paper Bags',
            description: 'Eco-friendly large kraft paper bags with handles.',
            sku: 'BAG-007',
            moq: 200,
            retailPrice: 22.99,
            wholesalePrice: 16.99,
            stockQuantity: 8000,
            imageUrl: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&q=80&w=400'
        },
        {
            name: 'Premium Facial Tissue',
            category: 'Tissue',
            description: 'Soft and gentle facial tissues in box packaging.',
            sku: 'TIS-008',
            moq: 150,
            retailPrice: 26.99,
            wholesalePrice: 19.99,
            stockQuantity: 4500,
            imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=400'
        }
    ];

    const adminUser = {
        email: 'admin@admin.com',
        passwordHash: 'admin',
        firstName: 'Admin',
        lastName: 'Admin',
        phone: '1234567890',
        address: '123 Main St',
        accountType: 'ADMIN',
        isVerified: true,
        approved: true
    };

    await prisma.user.upsert({
        where: { email: adminUser.email },
        update: {},
        create: adminUser
    });

    for (const product of products) {
        await prisma.product.upsert({
            where: { sku: product.sku },
            update: {},
            create: product
        });
    }

    console.log('✅ Database seeded successfully!');
    console.log(`📦 Created ${products.length} products`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
