import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCategoriesUnified1749177026503 implements MigrationInterface {
  name = 'SeedCategoriesUnified1749177026503';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed das categorias padrão
    await queryRunner.query(`
      INSERT INTO "category" ("name", "type") VALUES 
        ('Aluguel', 'expense'),
        ('Alimentação', 'expense'),
        ('Lazer', 'expense'),
        ('Transporte', 'expense'),
        ('Educação', 'expense'),
        ('Saúde', 'expense'),
        ('Outros Gastos', 'expense'),
        ('Salário', 'income'),
        ('Investimentos', 'income'),
        ('Freelance', 'income'),
        ('Bonus', 'income'),
        ('Outras Receitas', 'income')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove as categorias inseridas
    await queryRunner.query(`
      DELETE FROM "category" 
      WHERE "name" IN (
        'Aluguel', 'Alimentação', 'Lazer', 'Transporte', 
        'Educação', 'Saúde', 'Outros Gastos', 'Salário', 
        'Investimentos', 'Freelance', 'Bonus', 'Outras Receitas'
      )
    `);
  }
}
