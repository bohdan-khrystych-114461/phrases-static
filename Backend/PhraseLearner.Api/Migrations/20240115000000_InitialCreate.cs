using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhraseLearner.Api.Migrations
{
    public partial class InitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop table if exists (for clean recreation)
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"Phrases\"");
            migrationBuilder.Sql("DELETE FROM \"__EFMigrationsHistory\" WHERE \"MigrationId\" != '20240115000000_InitialCreate'");
            
            migrationBuilder.CreateTable(
                name: "Phrases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Meaning = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Example = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PersonalNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextReviewAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Phrases", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Phrases_NextReviewAt",
                table: "Phrases",
                column: "NextReviewAt");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Phrases");
        }
    }
}
