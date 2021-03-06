import React, { Component } from 'react'
import { Query, Mutation } from 'react-apollo'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { gql } from 'apollo-boost'
import { DRAFTS_QUERY } from './DraftsPage'
import { FEED_QUERY } from './FeedPage'
import {
  DeletePostMutation,
  DeletePostMutationVariables,
  PublishMutation,
  PublishMutationVariables,
  PostQuery,
  PostQueryVariables,
} from '../generated/types'

class DetailPage extends Component<RouteComponentProps<any>> {
  render() {
    return (
      <Query<PostQuery, PostQueryVariables>
        query={POST_QUERY}
        variables={{ id: this.props.match.params.id }}
      >
        {({ data, loading, error }) => {
          if (loading) {
            return (
              <div className="flex w-100 h-100 items-center justify-center pt7">
                <div>Loading ...</div>
              </div>
            )
          }

          if (error) {
            return (
              <div className="flex w-100 h-100 items-center justify-center pt7">
                <div>An unexpected error occured.</div>
              </div>
            )
          }

          const { post } = data
          const action = this.renderAction(post)
          return (
            <>
              <h1 className="f3 black-80 fw4 lh-solid">{data.post.title}</h1>
              <p className="black-80 f5">
                By {data.post.author.name || 'Unknown author'}
              </p>
              <p className="black-80 fw3">{data.post.content}</p>
              {action}
            </>
          )
        }}
      </Query>
    )
  }

  private renderAction({ id, published }) {
    const publishMutation = (
      <Mutation<PublishMutation, PublishMutationVariables>
        mutation={PUBLISH_MUTATION}
        update={(cache, { data }) => {
          const { drafts } = cache.readQuery({ query: DRAFTS_QUERY })
          const { feed } = cache.readQuery({ query: FEED_QUERY })
          cache.writeQuery({
            query: FEED_QUERY,
            data: { feed: feed.concat([data.publish]) },
          })
          cache.writeQuery({
            query: DRAFTS_QUERY,
            data: {
              drafts: drafts.filter(draft => draft.id !== data.publish.id),
            },
          })
        }}
      >
        {(publish, { data, loading, error }) => {
          return (
            <a
              className="f6 dim br1 ba ph3 pv2 mb2 dib black pointer"
              href="done"
              onClick={async e => {
                e.preventDefault()
                await publish({
                  variables: { id },
                })
                this.props.history.replace('/')
              }}
            >
              Publish
            </a>
          )
        }}
      </Mutation>
    )
    const deleteMutation = (
      <Mutation<DeletePostMutation, DeletePostMutationVariables>
        mutation={DELETE_MUTATION}
        update={(cache, { data }) => {
          if (published) {
            const { feed } = cache.readQuery({ query: FEED_QUERY })
            cache.writeQuery({
              query: FEED_QUERY,
              data: {
                feed: feed.filter(post => post.id !== data.deletePost.id),
              },
            })
          } else {
            const { drafts } = cache.readQuery({ query: DRAFTS_QUERY })
            cache.writeQuery({
              query: DRAFTS_QUERY,
              data: {
                drafts: drafts.filter(draft => draft.id !== data.deletePost.id),
              },
            })
          }
        }}
      >
        {(deletePost, { data, loading, error }) => {
          return (
            <a
              className="f6 dim br1 ba ph3 pv2 mb2 dib black pointer"
              onClick={async e => {
                e.preventDefault()
                await deletePost({
                  variables: { id },
                })
                this.props.history.replace('/')
              }}
              href="back"
            >
              Delete
            </a>
          )
        }}
      </Mutation>
    )
    if (!published) {
      return (
        <>
          {publishMutation}
          {deleteMutation}
        </>
      )
    }
    return deleteMutation
  }
}

const POST_QUERY = gql`
  query Post($id: ID!) {
    post(where: { id: $id }) {
      id
      title
      content
      published
      author {
        id
        name
      }
    }
  }
`

const PUBLISH_MUTATION = gql`
  mutation Publish($id: ID!) {
    publish(id: $id) {
      id
      published
    }
  }
`

const DELETE_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    deletePost(where: { id: $id }) {
      id
    }
  }
`

export default withRouter(DetailPage)
