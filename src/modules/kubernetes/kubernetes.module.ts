import { Module, Provider } from '@nestjs/common';
import { KubernetesService } from './kubernetes.service';
import {
  AppsV1Api,
  CoreV1Api,
  KubeConfig,
  NetworkingV1Api,
  RbacAuthorizationV1Api,
} from '@kubernetes/client-node';

const makeKubernetes = (): Provider[] => {
  const kc: KubeConfig = new KubeConfig();
  kc.loadFromDefault();
  // TODO: see what is needed and what is not needed
  return [
    {
      provide: KubeConfig,
      useValue: kc,
    },
    {
      provide: CoreV1Api,
      useValue: kc.makeApiClient(CoreV1Api),
    },
    {
      provide: AppsV1Api,
      useValue: kc.makeApiClient(AppsV1Api),
    },
    {
      provide: NetworkingV1Api,
      useValue: kc.makeApiClient(NetworkingV1Api),
    },
    {
      provide: RbacAuthorizationV1Api,
      useValue: kc.makeApiClient(RbacAuthorizationV1Api),
    },
    // TODO: remove this if not needed
    // {
    //   provide: 'KUBERNETES_CONFIG',
    //   useFactory: (configService: ConfigService<Config>) => {
    //     return configService.get<KubernetesConfig>('kubernetes');
    //   },
    //   inject: [ConfigService],
    // },
  ];
};

@Module({
  providers: [...makeKubernetes(), KubernetesService],
})
export class KubernetesModule {}
