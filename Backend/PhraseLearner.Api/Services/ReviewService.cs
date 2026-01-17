using Microsoft.EntityFrameworkCore;
using PhraseLearner.Api.Data;
using PhraseLearner.Api.Models;

namespace PhraseLearner.Api.Services;

public class ReviewService
{
    private readonly AppDbContext _db;
    private readonly Random _random = new();

    public ReviewService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Phrase>> GetTodayReviewAsync()
    {
        var now = DateTime.UtcNow;
        return await _db.Phrases
            .Where(p => p.Status != PhraseStatus.Mastered && p.NextReviewAt <= now)
            .OrderBy(p => p.NextReviewAt)
            .ToListAsync();
    }

    public async Task<Phrase?> ProcessReviewAsync(Guid phraseId, string action)
    {
        var phrase = await _db.Phrases.FindAsync(phraseId);
        if (phrase == null) return null;

        phrase.LastReviewedAt = DateTime.UtcNow;

        if (action.Equals("know", StringComparison.OrdinalIgnoreCase))
        {
            HandleKnow(phrase);
        }
        else if (action.Equals("dontKnow", StringComparison.OrdinalIgnoreCase))
        {
            HandleDontKnow(phrase);
        }

        await _db.SaveChangesAsync();
        return phrase;
    }

    private void HandleKnow(Phrase phrase)
    {
        // "Know It" = mastered, won't appear again
        phrase.Status = PhraseStatus.Mastered;
        phrase.NextReviewAt = DateTime.MaxValue;
    }

    private void HandleDontKnow(Phrase phrase)
    {
        // Keep in Learning, show again at end of current session
        phrase.Status = PhraseStatus.Learning;
        phrase.NextReviewAt = DateTime.UtcNow.AddSeconds(1);
    }
}
