const { gql } = require("apollo-server-express");

exports.resolvers = {
  Mutation: {
    sampleRevisableMutation: async (_, { smileSampleId, revisable }) => {
      return updateSamples;
    }
  }
};

exports.sampleRevisableMutationQuery = gql`
  mutation SampleRevisableMutation(
    $where: SampleWhere
    $update: SampleUpdateInput
  ) {
    updateSamples(where: $where, update: $update) {
      samples {
        smileSampleId
        revisable
      }
    }
  }
`;
