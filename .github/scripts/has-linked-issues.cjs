// @ts-check

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context, github }) => {
  const { eventName, payload, repo } = context

  if (eventName !== "pull_request_target" && eventName !== "pull_request") {
    throw new Error(
      `This action can only run on "pull_request_target" or "pull_request", but "${eventName}" was received. Please update your workflow.`,
    )
  }

  const query = /* gql */ `query ($prNumber: Int!, $repositoryName: String!, $repositoryOwner: String!) {
    repository(name: $repositoryName, owner: $repositoryOwner) {
      pullRequest(number: $prNumber) {
        closingIssuesReferences(first: 10) {
          nodes {
            number
          }
        }
      }
    }
  }`
  const variables = {
    prNumber: payload.pull_request?.number,
    repositoryOwner: repo.owner,
    repositoryName: repo.repo,
  }

  const response = await github.graphql(query, variables)
  const issues = response.repository.pullRequest.closingIssuesReferences.nodes
  return Boolean(issues.length)
}
