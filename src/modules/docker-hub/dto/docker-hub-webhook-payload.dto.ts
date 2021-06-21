import { agoraCloudPrefix } from './../../../utils/prefix';
import { Type } from 'class-transformer';
import {
  Contains,
  Equals,
  IsDefined,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

const dockerHubRepositoryUrl = 'https://hub.docker.com/r';
const dockerHubRegistryUrl = 'https://registry.hub.docker.com';
const dockerImagePusher = 'saidg';

export enum DockerImageName {
  Server = 'server',
  Ui = 'ui',
}

export enum DockerImageTag {
  MainLatest = 'main-latest',
  DevelopLatest = 'develop-latest',
  SaidLatest = 'said-latest',
  MarcLatest = 'marc-latest',
  WaleedLatest = 'waleed-latest',
}

export enum DockerRepository {
  AgoraCloudServer = 'agoracloud/server',
  AgoraCloudUi = 'agoracloud/ui',
}

export class DockerHubWebhookRepositoryPayloadDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(DockerImageName)
  readonly name!: DockerImageName;

  @IsString()
  @IsNotEmpty()
  @Equals(agoraCloudPrefix)
  readonly namespace!: string;

  @IsString()
  @IsNotEmpty()
  @Equals(agoraCloudPrefix)
  readonly owner!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(DockerRepository)
  readonly repo_name!: DockerRepository;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsIn([
    `${dockerHubRepositoryUrl}/${DockerRepository.AgoraCloudServer}`,
    `${dockerHubRepositoryUrl}/${DockerRepository.AgoraCloudUi}`,
  ])
  readonly repo_url!: string;

  constructor(partial: Partial<DockerHubWebhookRepositoryPayloadDto>) {
    Object.assign(this, partial);
  }
}

export class DockerHubWebhookPushDataPayloadDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(DockerImageTag)
  readonly tag!: DockerImageTag;

  @IsString()
  @IsNotEmpty()
  @Equals(dockerImagePusher)
  readonly pusher!: string;

  constructor(partial: Partial<DockerHubWebhookPushDataPayloadDto>) {
    Object.assign(this, partial);
  }
}

export class DockerHubWebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @Contains(`${dockerHubRegistryUrl}/u/${agoraCloudPrefix}`)
  readonly callback_url!: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => DockerHubWebhookPushDataPayloadDto)
  readonly push_data!: DockerHubWebhookPushDataPayloadDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DockerHubWebhookRepositoryPayloadDto)
  readonly repository!: DockerHubWebhookRepositoryPayloadDto;

  constructor(partial: Partial<DockerHubWebhookPayloadDto>) {
    Object.assign(this, partial);
  }
}
