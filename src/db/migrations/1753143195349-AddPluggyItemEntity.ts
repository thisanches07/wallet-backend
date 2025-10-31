import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePluggyItemWithImageUrl1753149999999
  implements MigrationInterface
{
  name = 'CreatePluggyItemWithImageUrl1753149999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "pluggy_item" (
        "id" SERIAL NOT NULL,
        "itemId" character varying NOT NULL,
        "institution" character varying(100) NOT NULL,
        "imageUrl" text NOT NULL,
        "connectedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" integer,
        CONSTRAINT "UQ_5f14ae3db3630cb97f5c50ff87f" UNIQUE ("itemId"),
        CONSTRAINT "PK_22a834276a3457a3d3c808cc21c" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "pluggy_item"
      ADD CONSTRAINT "FK_9acf42b9f030eade722d165900f"
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pluggy_item"
      DROP CONSTRAINT "FK_9acf42b9f030eade722d165900f"
    `);

    await queryRunner.query(`
      DROP TABLE "pluggy_item"
    `);
  }
}
