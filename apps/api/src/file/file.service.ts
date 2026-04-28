import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import 'multer'
import { ConfigEnum } from '../shared/config.enum'

const BUCKET_NAME = 'stansburyswim-public'

@Injectable()
export class FileService {
  private readonly supabase: SupabaseClient

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.getOrThrow<string>(ConfigEnum.SupabaseUrl)
    const serviceRoleKey = this.configService.getOrThrow<string>(ConfigEnum.SupabaseServiceRoleKey)
    this.supabase = createClient(url, serviceRoleKey)
  }

  async uploadFile(file: Express.Multer.File, userId: string): Promise<string> {
    const fileExtension = file.originalname.split('.').pop()
    const fileName = `${userId}/${uuidv4()}.${fileExtension}`

    const { error } = await this.supabase.storage.from(BUCKET_NAME).upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })
    if (error) {
      throw error
    }

    const { data } = this.supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)
    return data.publicUrl
  }
}
