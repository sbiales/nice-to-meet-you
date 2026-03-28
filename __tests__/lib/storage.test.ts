import { s3, BUCKET } from '~/server/lib/storage'
import { ListBucketsCommand } from '@aws-sdk/client-s3'

describe('storage client', () => {
  it('can connect to S3-compatible storage', async () => {
    const response = await s3.send(new ListBucketsCommand({}))
    expect(response.Buckets).toBeDefined()
  })
})
