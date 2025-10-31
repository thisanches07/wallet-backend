import { MigrationInterface, QueryRunner } from 'typeorm';

export class FlattenCategoryIntoTextField1699999999999
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adiciona o novo campo `category` do tipo string (temporário)
    await queryRunner.query(`ALTER TABLE "income" ADD "category" varchar`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "category" varchar`);

    // 2. Popula o campo novo com os dados da tabela Category
    await queryRunner.query(`
      UPDATE "income"
      SET "category" = category.name
      FROM category
      WHERE "income"."categoryId" = category.id
    `);

    await queryRunner.query(`
      UPDATE "expense"
      SET "category" = category.name
      FROM category
      WHERE "expense"."categoryId" = category.id
    `);

    // 3. Remove as foreign keys (se necessário)
    await queryRunner.query(
      `ALTER TABLE "income" DROP CONSTRAINT IF EXISTS "FK_income_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" DROP CONSTRAINT IF EXISTS "FK_expense_category"`,
    );

    // 4. Remove a coluna antiga de relacionamento
    await queryRunner.query(`ALTER TABLE "income" DROP COLUMN "categoryId"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "categoryId"`);

    // 5. Remove a tabela category
    await queryRunner.query(`DROP TABLE "category"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Recria a tabela category
    await queryRunner.query(`
      CREATE TABLE "category" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL
      )
    `);

    // 2. Recria a coluna categoryId
    await queryRunner.query(`ALTER TABLE "income" ADD "categoryId" integer`);
    await queryRunner.query(`ALTER TABLE "expense" ADD "categoryId" integer`);

    // 3. Recria os relacionamentos
    await queryRunner.query(`
      ALTER TABLE "income"
      ADD CONSTRAINT "FK_income_category" FOREIGN KEY ("categoryId") REFERENCES "category" ("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "expense"
      ADD CONSTRAINT "FK_expense_category" FOREIGN KEY ("categoryId") REFERENCES "category" ("id") ON DELETE SET NULL
    `);

    // ⚠️ Dados não são restaurados no rollback
    await queryRunner.query(`ALTER TABLE "income" DROP COLUMN "category"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "category"`);
  }
}
