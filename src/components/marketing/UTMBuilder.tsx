import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, Save, Link2, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const sources = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google' },
  { value: 'olx', label: 'OLX' },
  { value: 'webmotors', label: 'Webmotors' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

const mediums = [
  { value: 'cpc', label: 'CPC (Custo por Clique)' },
  { value: 'cpm', label: 'CPM (Custo por Mil)' },
  { value: 'social', label: 'Social' },
  { value: 'organic', label: 'Orgânico' },
  { value: 'referral', label: 'Referência' },
  { value: 'email', label: 'Email' },
  { value: 'display', label: 'Display' },
];

export function UTMBuilder() {
  const [baseUrl, setBaseUrl] = useState('https://matheusveiculos.com.br/veiculos');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [linkName, setLinkName] = useState('');
  const [copied, setCopied] = useState(false);

  const queryClient = useQueryClient();

  // Generate full URL
  const fullUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (utmSource) params.set('utm_source', utmSource);
    if (utmMedium) params.set('utm_medium', utmMedium);
    if (utmCampaign) params.set('utm_campaign', utmCampaign);
    if (utmContent) params.set('utm_content', utmContent);
    if (utmTerm) params.set('utm_term', utmTerm);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [baseUrl, utmSource, utmMedium, utmCampaign, utmContent, utmTerm]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyData = any;

  // Fetch saved UTMs
  const { data: savedUtms } = useQuery({
    queryKey: ['utm-links'],
    queryFn: async () => {
      const { data, error } = await (supabase as AnyData)
        .from('utm_links')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as AnyData[];
    },
  });

  // Save UTM mutation
  const saveUtm = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as AnyData)
        .from('utm_links')
        .insert({
          name: linkName || `UTM ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
          base_url: baseUrl,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent || null,
          utm_term: utmTerm || null,
          full_url: fullUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-links'] });
      toast.success('UTM salvo com sucesso!');
      setLinkName('');
    },
    onError: () => {
      toast.error('Erro ao salvar UTM');
    },
  });

  // Delete UTM mutation
  const deleteUtm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as AnyData).from('utm_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-links'] });
      toast.success('UTM removido');
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isValid = utmSource && utmMedium && utmCampaign;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Gerador de UTM</h1>
        <p className="text-muted-foreground">Crie URLs rastreáveis para suas campanhas</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Builder Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Construir URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>URL Base *</Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://seusite.com.br/pagina"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Origem (utm_source) *</Label>
                <Select value={utmSource} onValueChange={setUtmSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mídia (utm_medium) *</Label>
                <Select value={utmMedium} onValueChange={setUtmMedium}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mediums.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Campanha (utm_campaign) *</Label>
              <Input
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="blackfriday2024"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Conteúdo (utm_content)</Label>
                <Input
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="banner_topo"
                />
              </div>

              <div>
                <Label>Termo (utm_term)</Label>
                <Input
                  value={utmTerm}
                  onChange={(e) => setUtmTerm(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="suv_seminovo"
                />
              </div>
            </div>

            {/* Generated URL */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-xs text-muted-foreground">URL Gerada:</Label>
              <p className="text-sm font-mono break-all mt-1">{fullUrl}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleCopy} className="flex-1">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copiado!' : 'Copiar URL'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open(fullUrl, '_blank')}
                disabled={!isValid}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {/* Save Section */}
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Input
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="Nome do link (opcional)"
                  className="flex-1"
                />
                <Button 
                  variant="secondary" 
                  onClick={() => saveUtm.mutate()}
                  disabled={!isValid}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved UTMs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">UTMs Salvos</CardTitle>
          </CardHeader>
          <CardContent>
            {savedUtms && savedUtms.length > 0 ? (
              <div className="space-y-3">
                {savedUtms.map((utm) => (
                  <div key={utm.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{utm.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(utm.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={async () => {
                            await navigator.clipboard.writeText(utm.full_url);
                            toast.success('URL copiada!');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteUtm.mutate(utm.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="secondary">{utm.utm_source}</Badge>
                      <Badge variant="outline">{utm.utm_medium}</Badge>
                      <Badge variant="outline">{utm.utm_campaign}</Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {utm.full_url}
                    </p>
                    {(utm.clicks > 0 || utm.leads_generated > 0) && (
                      <div className="flex gap-4 mt-2 text-xs">
                        <span>{utm.clicks} cliques</span>
                        <span>{utm.leads_generated} leads</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum UTM salvo ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
