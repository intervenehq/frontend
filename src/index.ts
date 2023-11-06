import Nango from "@nangohq/frontend";

export interface InterveneClientOptions {
  publicKey: string;
  host?: string;
}

export class Intervene {
  nango?: Nango;

  constructor(public options: InterveneClientOptions) {}

  get publicKey() {
    return this.options.publicKey;
  }

  get host() {
    return this.options.host ?? "https://intervene.run";
  }

  async configure() {
    const response = await fetch(`${this.host}/v1/config`, {
      headers: this.authHeader,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const responseJson = await response.json();

    this.nango = new Nango({
      publicKey: responseJson.nango_public_key,
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
    const url = new URL(`${this.host}/v1/integrations/${provider}/connections`);
    url.searchParams.set("user_id", userId);

    const response = await fetch(url.toString(), {
      headers: this.authHeader,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const responseJson = await response.json();

    return responseJson as {
      nango_provider_config_key: string;
      nango_connection_id: string;
    };
  }

  private async getConnectionStatus(provider: string, userId: string) {
    const url = new URL(
      `${this.host}/v1/integrations/${provider}/connections/${userId}`
    );

    const response = await fetch(url.toString(), {
      headers: this.authHeader,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const responseJson = await response.json();

    // eslint-disable-next-line @typescript-eslint/ban-types
    return responseJson as {};
  }

  private get authHeader() {
    return {
      Authorization: `Bearer ${this.publicKey}`,
      "Content-Type": "application/json",
    };
  }
}
