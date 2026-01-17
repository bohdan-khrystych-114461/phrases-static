using PhraseLearner.Api.Models;

namespace PhraseLearner.Api.Dtos;

public record PhraseDto(
    Guid Id,
    string Text,
    string? Meaning,
    string? Example,
    string? PersonalNote,
    string Status,
    DateTime CreatedAt,
    DateTime? LastReviewedAt,
    DateTime NextReviewAt
)
{
    public static PhraseDto FromEntity(Phrase p) => new(
        p.Id,
        p.Text,
        p.Meaning,
        p.Example,
        p.PersonalNote,
        p.Status.ToString(),
        p.CreatedAt,
        p.LastReviewedAt,
        p.NextReviewAt
    );
}

public record CreatePhraseDto(
    string Text,
    string? Meaning,
    string? Example,
    string? PersonalNote
);

public record UpdatePhraseDto(
    string Text,
    string? Meaning,
    string? Example,
    string? PersonalNote,
    string? Status
);

public record ReviewActionDto(string Action);

public record AutofillRequestDto(string Text);
public record AutofillResultDto(string Meaning, string Example, string PersonalNote);
