import $ky, { KyInstance } from "ky";
import Nango from "@nangohq/frontend";
import { paths } from './types/schema';

export interface InterveneClientOptions {
  publicKey: string;
  host?: string;
}

export class Intervene {
  nango?: Nango;
  ky: KyInstance

  constructor(options: InterveneClientOptions) {
    this.ky = $ky.create({
      prefixUrl: options.host ?? "https://api.intervene.run",
      headers: {
        Authorization: `Bearer ${options.publicKey}`,
      },
      cache: "no-cache",
    });
  }

  async configure() {
    const response = await this.ky.get("v1/config");

    const result = (await response.json()) as paths['/v1/config']['get']['responses']['200']['content']['application/json'];

    this.nango = new Nango({
      publicKey: result.nango_public_key,
    });
  }

  async auth(provider: string, userId: string, hmac_digest: string) {
    if (!hmac_digest) {
      throw new Error(
        `hmac_digest is required, you can get it by calling /v1/integrations/${provider}/connections/${userId}/hmac_digest from your backend`
      );
    }

    await this.configure();
    const connectionParam = await this.getConnectionParams(provider, userId);

    await this.nango!.auth(
      connectionParam.nango_provider_config_key,
      connectionParam.nango_connection_id,
      {
        hmac: hmac_digest,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    );

    return await this.connectionStatus(provider, userId);
  }

  async connectionStatus(
    provider: string,
    userId: string
  ): Promise<{ connected: boolean }> {
    await this.configure();

    try {
      await this.getConnectionStatus(provider, userId);
      return { connected: true };
    } catch (e) {
      /* empty */
    }

    return { connected: false };
  }

  private async getConnectionParams(provider: string, userId: string) {
    const response = await this.ky.get('v1/integrations/{provider}/connections'.replace('{provider}', provider), {
      searchParams: {
        user_id: userId,
      }
    });

    return (await response.json()) as paths['/v1/integrations/{provider}/connections']['get']['responses']['200']['content']['application/json'];
  }

  private async getConnectionStatus(provider: string, userId: string) {
    const response = await this.ky.get(
      "v1/integrations/{provider}/connections/{user_id}"
        .replace("{provider}", provider)
        .replace("{user_id}", userId)
    );

    const result = (await response.json()) as paths['/v1/integrations/{provider}/connections/{user_id}']['get']['responses']['200']['content']['application/json'];

    return result;
  }
}
