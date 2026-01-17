using Microsoft.EntityFrameworkCore;
using PhraseLearner.Api.Models;

namespace PhraseLearner.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Phrase> Phrases => Set<Phrase>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Phrase>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Text).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Meaning).HasMaxLength(1000);
            entity.Property(e => e.Example).HasMaxLength(1000);
            entity.Property(e => e.PersonalNote).HasMaxLength(1000);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasIndex(e => e.NextReviewAt);
        });
    }
}
