import { Module, Provider } from '@nestjs/common';
import { KubernetesService } from './kubernetes.service';
import { AppsV1Api, CoreV1Api, KubeConfig } from '@kubernetes/client-node';

const makeKubernetes = (): Provider[] => {
  const kc: KubeConfig = new KubeConfig();
  kc.loadFromDefault();
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
  ];
};

@Module({
  providers: [...makeKubernetes(), KubernetesService],
})
export class KubernetesModule {}
