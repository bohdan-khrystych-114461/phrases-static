namespace PhraseLearner.Api.Models;

public enum PhraseStatus
{
    New,
    Learning,
    Mastered
}

public class Phrase
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? Meaning { get; set; }
    public string? Example { get; set; }
    public string? PersonalNote { get; set; }
    public PhraseStatus Status { get; set; } = PhraseStatus.New;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastReviewedAt { get; set; }
    public DateTime NextReviewAt { get; set; } = DateTime.UtcNow;
}
