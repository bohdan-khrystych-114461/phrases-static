using Microsoft.AspNetCore.Mvc;
using PhraseLearner.Api.Dtos;
using PhraseLearner.Api.Services;

namespace PhraseLearner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewController : ControllerBase
{
    private readonly ReviewService _reviewService;

    public ReviewController(ReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet("today")]
    public async Task<ActionResult<List<PhraseDto>>> GetTodayReview()
    {
        var phrases = await _reviewService.GetTodayReviewAsync();
        return Ok(phrases.Select(PhraseDto.FromEntity).ToList());
    }

    [HttpPost("{id:guid}")]
    public async Task<ActionResult<PhraseDto>> ProcessReview(Guid id, [FromBody] ReviewActionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Action))
            return BadRequest("Action is required");

        if (!dto.Action.Equals("know", StringComparison.OrdinalIgnoreCase) &&
            !dto.Action.Equals("dontKnow", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Action must be 'know' or 'dontKnow'");
        }

        var phrase = await _reviewService.ProcessReviewAsync(id, dto.Action);
        if (phrase == null) return NotFound();

        return Ok(PhraseDto.FromEntity(phrase));
    }
}
