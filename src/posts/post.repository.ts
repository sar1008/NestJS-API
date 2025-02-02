import { EntityRepository, FindManyOptions, MoreThan, Repository } from 'typeorm'
import Post from './post.entity'
import CreatePostDto from './dto/createPost.dto'
import UpdatePostDto from './dto/updatePost.dto'
import PostNotFoundException from './exceptions/postNotFound.exception'
import User from '../users/entities/user.entity'

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  async getAllPosts(offset?: number, limit?: number, startId?: number): Promise<{ items: Post[]; count: number }> {
    const where: FindManyOptions<Post>['where'] = {}
    let separateCount = 0
    if (startId) {
      where.id = MoreThan(startId)
      separateCount = await this.count()
    }

    const [items, count] = await this.findAndCount({
      where,
      relations: ['author'],
      order: {
        id: 'ASC',
      },
      skip: offset,
      take: limit,
    })

    return {
      items,
      count: startId ? separateCount : count,
    }
  }

  async getPostById(id: number): Promise<Post> {
    const post = await this.findOne(id, { relations: ['author'] })
    if (!post) throw new PostNotFoundException(id)
    return post
  }

  async createPost(createPostDto: CreatePostDto, user: User): Promise<Post> {
    const { title, content } = createPostDto
    const post = this.create({
      title,
      content,
      author: user,
    })
    return this.save(post)
  }

  async updatePost(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    await this.update(id, updatePostDto)
    const updatedPost = await this.findOne(id, { relations: ['author'] })
    if (updatedPost) {
      return updatedPost
    }
    throw new PostNotFoundException(id)
  }

  async deletePost(id: number): Promise<void> {
    const result = await this.delete({ id })
    if (!result.affected) throw new PostNotFoundException(id)
  }
}
