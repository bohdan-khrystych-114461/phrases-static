using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace PhraseLearner.Api.Services;

public interface IAiService
{
    Task<AutofillResult?> AutofillPhraseAsync(string phrase);
}

public record AutofillResult(string Meaning, string Example, string PersonalNote);

public class GroqAiService : IAiService
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;

    public GroqAiService(IConfiguration config)
    {
        _httpClient = new HttpClient();
        // Groq is FREE - get your key at https://console.groq.com/keys
        _apiKey = config["Groq:ApiKey"] ?? Environment.GetEnvironmentVariable("GROQ_API_KEY");
    }

    public async Task<AutofillResult?> AutofillPhraseAsync(string phrase)
    {
        if (string.IsNullOrEmpty(_apiKey))
            return null;

        var prompt = $@"For the phrase or word ""{phrase}"", provide:
1. A clear, concise meaning/definition
2. An example sentence using it naturally
3. A memorable tip or note to help remember it

Respond ONLY with valid JSON in this exact format, no other text:
{{""meaning"": ""..."", ""example"": ""..."", ""personalNote"": ""...""}}";

        var requestBody = new
        {
            model = "llama-3.1-8b-instant",  // Free, fast model
            messages = new[]
            {
                new { role = "system", content = "You are a helpful language learning assistant. Respond only with valid JSON, no markdown or extra text." },
                new { role = "user", content = prompt }
            },
            temperature = 0.7,
            max_tokens = 300
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrEmpty(content))
                return null;

            // Clean up potential markdown formatting
            content = content.Trim();
            if (content.StartsWith("```json")) content = content[7..];
            if (content.StartsWith("```")) content = content[3..];
            if (content.EndsWith("```")) content = content[..^3];
            content = content.Trim();

            using var resultDoc = JsonDocument.Parse(content);
            var root = resultDoc.RootElement;
            
            return new AutofillResult(
                root.GetProperty("meaning").GetString() ?? "",
                root.GetProperty("example").GetString() ?? "",
                root.GetProperty("personalNote").GetString() ?? ""
            );
        }
        catch
        {
            return null;
        }
    }
}
