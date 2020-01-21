import './ExperimentOverview.scss';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Release from 'azure-devops-extension-api/Release';
import * as SDK from 'azure-devops-extension-sdk';
import ProgressionComponent from './Component/ProgressionComponent';
import ExpRestClient from './ExpRestClient';
import ExpUtility from './ExpUtility';
import { LoadingSpinner } from './Component/LoadingSpinner';
import { MessageCard, MessageCardSeverity } from 'azure-devops-ui/MessageCard';
import { Card, ICardTitleProps } from 'azure-devops-ui/Card';
import { TitleSize, Header } from 'azure-devops-ui/Header';
import { Link } from 'azure-devops-ui/Link';
import { Icon } from 'azure-devops-ui/Icon';

export interface IExperimentOverviewState {
    progression: any;
    loaded: boolean;
    error?: string;
}

export class ExperimentOverview extends React.Component<{}, IExperimentOverviewState> {
    constructor(props) {
        super(props);
        this.state = {
            progression: null,
            loaded: false
        };

        this._expClient = new ExpRestClient();
    }

    public componentDidMount() {
        SDK.register('registeredEnvironmentObject', {
            isInvisible: (context): boolean => {
                return !ExpUtility.isOverviewTabVisible(context);
            }
        });
        
        SDK.init();
        SDK.ready().then(() => {    
            let context = SDK.getConfiguration();
            console.log(`Extension context`, context);
            if (!!context.releaseEnvironment) {
                this._expClient.getRelease(context.releaseEnvironment.releaseId).then((release: Release.Release) => {
                    let [featureId, progressionId] = ExpUtility.getFeatureAndProgressionIdFromRelease(release);
                    if (!featureId || !progressionId) {
                        this.setState({
                            loaded: true,
                            error: "Failed to load UI contribution. FeatureId or ProgressionId variable has not been set in the pipeline."
                        });

                        return;
                    }

                    let serviceConnectionId = ExpUtility.getServiceConnectionId(context);
                    this._expClient.getProgression(serviceConnectionId, featureId, progressionId).then((progression) => {
                        console.log(progression);
                        this.setState({
                            progression: progression,
                            loaded: true,
                            error: ''
                        });
                    }, (error) => {
                        this.setState({
                            loaded: true,
                            error: !!error.message ? error.message : error
                        });
                    });
                });
            }
        });
    }

	public render(): JSX.Element {
        let featureRolloutMetadata = !!this.state.progression && this.state.progression['Studies'][0]['FeatureRolloutMetadata'];
		return (
			<div>
                {!this.state.loaded && <LoadingSpinner />}
                {!!this.state.error && this.getErrorComponent(this.state.error)}
                {!!this.state.progression && !!featureRolloutMetadata &&
                    <Card
                        className='feature-card'
                        titleProps={{
                            text: featureRolloutMetadata.Name, 
                            size: TitleSize.Large
                        } as ICardTitleProps }
                        headerDescriptionProps={{
                            text: <div>
                                    {featureRolloutMetadata.Description + " "}
                                    <Link href={`https://exp.microsoft.com/a/feature/${featureRolloutMetadata.RootExperimentId}`} target='_blank'>
                                        (Control tower <Icon ariaLabel="Video icon" iconName="NavigateExternalInline" />)
                                    </Link>
                                </div>
                        }}
                    >
                        <ProgressionComponent progression={this.state.progression} />
                    </Card>
                }
			</div>
		);
    }

    public getErrorComponent(error: string): JSX.Element {
        return (
            <MessageCard
                className='flex-self-stretch'
                severity={MessageCardSeverity.Error}
            >
                {error}
            </MessageCard>
        );
    }
    
    private _expClient: ExpRestClient;
}

ReactDOM.render(<ExperimentOverview />, document.getElementById('experiment-overview'));