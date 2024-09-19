import { Migration } from '@mikro-orm/migrations';

export class Migration20240916121810 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "post" ("id" serial primary key, "created_at" timestamptz not null default 'NOW()', "updated_at" timestamptz not null default 'NOW()', "title" text not null);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "post" cascade;`);
  }
}
