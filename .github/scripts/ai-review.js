import "dotenv/config";
import { Octokit } from "@octokit/rest";
import OpenAI from "openai";


console.log('ENVS', process.env)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const prNumber = process.env.GITHUB_PR_NUMBER;

async function getDiff() {
    const { data } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
    });
    return data.diff_url;
}

async function generateReview(diff) {
    const prompt = `
  Você é um revisor de código experiente. Analise a seguinte diff e forneça comentários sobre melhorias e boas práticas.

  Diff:
  ${diff}
  `;

    const response = await openai.completions.create({
        model: "gpt-4",
        prompt,
        max_tokens: 500,
    });

    return response.choices[0].text.trim();
}

async function commentOnPR(review) {
    await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: review,
    });
}

async function main() {
    const diff = await getDiff();
    const review = await generateReview(diff);
    await commentOnPR(review);
}

main().catch(console.error);
