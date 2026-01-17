using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhraseLearner.Api.Data;
using PhraseLearner.Api.Dtos;
using PhraseLearner.Api.Models;
using PhraseLearner.Api.Services;

namespace PhraseLearner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PhrasesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAiService _aiService;

    public PhrasesController(AppDbContext db, IAiService aiService)
    {
        _db = db;
        _aiService = aiService;
    }

    [HttpPost]
    public async Task<ActionResult<PhraseDto>> Create([FromBody] CreatePhraseDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Text is required");

        var phrase = new Phrase
        {
            Id = Guid.NewGuid(),
            Text = dto.Text.Trim(),
            Meaning = dto.Meaning?.Trim(),
            Example = dto.Example?.Trim(),
            PersonalNote = dto.PersonalNote?.Trim(),
            Status = PhraseStatus.New,
            CreatedAt = DateTime.UtcNow,
            NextReviewAt = DateTime.UtcNow
        };

        _db.Phrases.Add(phrase);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = phrase.Id }, PhraseDto.FromEntity(phrase));
    }

    [HttpGet]
    public async Task<ActionResult<List<PhraseDto>>> GetAll([FromQuery] string? search, [FromQuery] string? status)
    {
        var query = _db.Phrases.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p => 
                p.Text.ToLower().Contains(searchLower) ||
                (p.Meaning != null && p.Meaning.ToLower().Contains(searchLower)) ||
                (p.Example != null && p.Example.ToLower().Contains(searchLower)) ||
                (p.PersonalNote != null && p.PersonalNote.ToLower().Contains(searchLower)));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PhraseStatus>(status, true, out var statusEnum))
        {
            query = query.Where(p => p.Status == statusEnum);
        }

        var phrases = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(phrases.Select(PhraseDto.FromEntity).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PhraseDto>> GetById(Guid id)
    {
        var phrase = await _db.Phrases.FindAsync(id);
        if (phrase == null) return NotFound();
        return Ok(PhraseDto.FromEntity(phrase));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PhraseDto>> Update(Guid id, [FromBody] UpdatePhraseDto dto)
    {
        var phrase = await _db.Phrases.FindAsync(id);
        if (phrase == null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Text is required");

        phrase.Text = dto.Text.Trim();
        phrase.Meaning = dto.Meaning?.Trim();
        phrase.Example = dto.Example?.Trim();
        phrase.PersonalNote = dto.PersonalNote?.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Status) && Enum.TryParse<PhraseStatus>(dto.Status, true, out var statusEnum))
        {
            phrase.Status = statusEnum;
        }

        await _db.SaveChangesAsync();
        return Ok(PhraseDto.FromEntity(phrase));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var phrase = await _db.Phrases.FindAsync(id);
        if (phrase == null) return NotFound();

        _db.Phrases.Remove(phrase);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("autofill")]
    public async Task<ActionResult<AutofillResultDto>> Autofill([FromBody] AutofillRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Text is required");

        try
        {
            var result = await _aiService.AutofillPhraseAsync(dto.Text.Trim());
            if (result == null)
                return StatusCode(503, "AI service unavailable. Please set GROQ_API_KEY environment variable.");

            return Ok(new AutofillResultDto(result.Meaning, result.Example, result.PersonalNote));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"AI service error: {ex.Message}");
        }
    }
}
